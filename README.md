# @major.chen/dsh-enter-swap

DSH Web GUI 的输入框快捷键互换插件：**Enter 换行，Shift+Enter 发送**。

- 宿主半体：空的（行为全在浏览器半体，入口只为让 Loader 有一行可挂载）。
- 浏览器半体：在 `document` 捕获阶段监听 `keydown`，只处理
  `[data-composer-input][data-lexical-editor="true"]` 上、不带 Ctrl/Cmd/Alt 的 Enter，
  跳过输入法组字与已处理事件，然后 `preventDefault + stopPropagation`，
  再派发一个 `shiftKey` 取反的 `KeyboardEvent`。
- 只在捕获阶段可行：Conversation 的 Enter 语义写死在 Lexical 的私有 keymap 里，
  设置 → 快捷键里的只读行也无法被其它插件改写。

## 安装

```bash
# 从 npm
dsh plugin --profile <profile> add @major.chen/dsh-enter-swap

# 或本地 link
dsh plugin --profile <profile> add link:/path/to/dsh-enter-swap
```

安装后**刷新页面**（新增 Client 插件不走免刷新 HMR）。

## 不受影响的行为

- 带修饰键的组合（Ctrl/Cmd/Alt+Enter）。
- 输入法组字（`isComposing` / keyCode 229 / `data-composer-composing`）。
- 其它文本控件、没有编辑器的 trigger composer。

## 已知限制

- 设置 → 快捷键里的参考行仍显示旧快捷键，无法覆盖（只读 fixed 行）。
- 只在浏览器侧生效；刷新页面后由插件重新安装监听器。

## 发布

```bash
npm publish --registry=https://registry.npmjs.org
```

（`publishConfig.access=public` 已声明。若本机 npm cache 目录不可写，再补 `--cache <可写目录>`。）
