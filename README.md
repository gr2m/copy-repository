# This is work in progress

# copy-repository

> CLI to copy a repository with meta data such as issues, labels, etc

```
GITHUB_TOKENS="<space separated list of tokens> SOURCE_REPO=gr2m/source-repo TARGET_REPO=gr2m/target-repo
```

`TARGET_REPO` is optional and defaults to the owner from `SOURCE_REPO` and a random name prefixed by `test-`.

ProTip: to delete a bunch of test repositories at once, we recommend [`npx @octoherd/script-delete-repository`](https://github.com/octoherd/script-delete-repository#readme).

See [gr2m/helpdesk#16](https://github.com/gr2m/helpdesk/issues/16) for more information about this repository and its motivation.

## License

[ISC](LICENSE)
