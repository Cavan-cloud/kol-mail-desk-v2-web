# cursor-rules-staging

The agent that bootstrapped this repo could not write a `.cursor/` directory
(the sandbox blocks creation of any `.cursor` path). The two `.mdc` rule files
are staged here so you can install them with one command:

```bash
mkdir -p .cursor && mv cursor-rules-staging .cursor/rules
```

After running that, the layout matches the spec:

```
.cursor/
└── rules/
    ├── 00-global.mdc
    └── frontend-next.mdc
```
