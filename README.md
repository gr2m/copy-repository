# copy-repository

> CLI to copy a repository with meta data such as issues, labels, etc

```
GITHUB_TOKENS="<space separated list of tokens>" SOURCE_REPO=gr2m/source-repo TARGET_REPO=gr2m/target-repo npx copy-repository
```

You need an access token for every issue and comment author in order for the issues to be created the same way in the target repository. Instead of creating personal access tokens for all users, I recommend to create a GitHub App with the permissions `administration:write` and `issues:write`, then create user-to-server tokens which will be scoped to this apps permissions and installations: https://create-user-to-server-token.netlify.app/.

`TARGET_REPO` is optional and defaults to the owner from `SOURCE_REPO` and a random name prefixed by `test-`.

ProTip: to delete a bunch of test repositories at once, we recommend [`npx @octoherd/script-delete-repository`](https://github.com/octoherd/script-delete-repository#readme).

See [gr2m/helpdesk#16](https://github.com/gr2m/helpdesk/issues/16) for more information about this repository and its motivation.

## License

[ISC](LICENSE)
