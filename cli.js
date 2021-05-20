import { readFile } from "fs/promises";
import { Octokit } from "octokit";
import dotenv from "dotenv";

dotenv.config();

// configuration
const owner = "Another-Practice-Organization";
const templateRepo = "template-issues-source";
const newRepoName = "test-" + Date.now();

// init octokit
const tokens = process.env.GITHUB_TOKENS.split(" ");
const octokit = new Octokit({
  auth: tokens[0],
});

// load users
const authors = {};
for (const token of tokens) {
  const authorOctokit = new Octokit({
    auth: token,
  });
  const { data: user } = await authorOctokit.request("GET /user");
  console.log("Authenticated as %s", user.login);
  authors[user.login] = authorOctokit;
}

// retrieve all data
const QUERY = await readFile("retrieve-data.graphql", "utf-8");
const result = await octokit.graphql(QUERY, {
  owner,
  repo: templateRepo,
});

const collaborators = result.repository.collaborators.edges.map((edge) => {
  return {
    permission: edge.permission,
    login: edge.node.login,
  };
});
const milestones = result.repository.milestones.nodes;
const labels = result.repository.labels.nodes;
const issues = result.repository.issues.nodes.map((issue) => {
  return {
    ...issue,
    assignees: issue.assignees.nodes,
    labels: issue.labels.nodes,
    comments: issue.comments.nodes,
  };
});

// create a new repository based on a template
const { data: repository } = await octokit.rest.repos.createUsingTemplate({
  template_owner: owner,
  template_repo: templateRepo,
  owner,
  name: newRepoName,
});
console.log("Repository created at %s", repository.html_url);

for (const collaborator of collaborators) {
  const { data } = await octokit.rest.repos.addCollaborator({
    owner,
    repo: repository.name,
    username: collaborator.login,
    permission: collaborator.permission,
  });

  if (data) {
    console.log(
      "%s invited to %s with permission %s (%s)",
      collaborator.login,
      repository.name,
      collaborator.permission,
      data.html_url
    );
    continue;
  }

  console.log(
    "%s is already a collaborator on %s",
    collaborator.login,
    repository.name
  );
}
for (const milestone of milestones) {
  const { data } = await octokit.rest.issues.createMilestone({
    owner,
    repo: repository.name,
    title: milestone.title,
    due_on: milestone.dueOn ? milestone.dueOn : undefined,
    description: milestone.description ? milestone.description : undefined,
  });
  console.log("Milestone %s created at %s", milestone.title, data.html_url);

  if (milestone.closed) {
    await octokit.rest.issues.updateMilestone({
      owner,
      repo: repository.name,
      milestone_number: data.number,
      state: "closed",
    });
    console.log("milestone closed");
  }
}
for (const label of labels) {
  try {
    await octokit.rest.issues.createLabel({
      owner,
      repo: repository.name,
      ...label,
    });
    console.log("Label %s created", label.name);
  } catch (error) {
    if (error.status === 422) {
      // label already exists, we are good
      continue;
    }

    throw error;
  }
}

for (const issue of issues) {
  console.log("Creating new issue as %s", issue.author.login);
  /** @type {Octokit} */
  let authorOctokit = authors[issue.author.login];

  if (!authorOctokit) {
    console.warn(
      "Authentication token missing in GITHUB_TOKENS for %s",
      issue.author.login
    );
    const login = Object.keys(authors)[0];
    console.log("creating issue as %s instead", login);
    authorOctokit = authors[login];
  }

  const issueAssignees = issue.assignees.map((user) => user.login);
  const issueLabels = issue.labels.map((label) => label.name);
  const issueMilestone = issue.milestone ? issue.milestone.number : undefined;
  const { data: newIssue } = await authorOctokit.rest.issues.create({
    owner,
    repo: repository.name,
    title: issue.title,
    body: issue.body,
    milestone: issueMilestone,
    labels: issueLabels,
    assignees: issueAssignees,
  });

  console.log("new issue created at %s", newIssue.html_url);

  for (const comment of issue.comments) {
    console.log("Creating new comment as %s", comment.author.login);

    /** @type {Octokit} */
    let authorOctokit = authors[comment.author.login];

    if (!authorOctokit) {
      console.warn(
        "Authentication token missing in GITHUB_TOKENS for %s",
        comment.author.login
      );
      const login = Object.keys(authors)[0];
      console.log("creating comment as %s instead", login);
      authorOctokit = authors[login];
    }

    const { data: newComment } = await authorOctokit.rest.issues.createComment({
      owner,
      repo: repository.name,
      issue_number: newIssue.number,
      body: comment.body,
    });

    console.log("new comment created at %s", newComment.html_url);
  }
}
