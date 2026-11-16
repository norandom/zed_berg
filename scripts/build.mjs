import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// This source has only whole-line // comments; do not use this as a general JSONC parser.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'source/berg-vscode.jsonc'), 'utf8')
  .replace(/^\s*\/\/.*$/gm, '').replace(/,\s*([}\]])/g, '$1'));
const c = source.colors;
const style = {};
const mapping = {
  'background': 'editor.background',
  'surface.background': 'editorWidget.background',
  'elevated_surface.background': 'editorHoverWidget.background',
  'border': 'editorGroup.border',
  'border.variant': 'tab.border',
  'border.focused': 'activityBar.activeFocusBorder',
  'border.selected': 'tab.activeBorder',
  'border.disabled': 'sideBar.border',
  'element.background': 'button.background',
  'element.hover': 'tab.hoverBackground',
  'element.active': 'list.focusBackground',
  'element.selected': 'list.activeSelectionBackground',
  'element.disabled': 'sideBar.background',
  'ghost_element.hover': 'list.inactiveSelectionBackground',
  'ghost_element.active': 'list.focusBackground',
  'ghost_element.selected': 'list.activeSelectionBackground',
  'ghost_element.disabled': 'sideBar.background',
  'text': 'button.foreground',
  'text.muted': 'foreground',
  'text.placeholder': 'input.placeholderForeground',
  'text.disabled': 'activityBar.inactiveForeground',
  'text.accent': 'editor.foreground',
  'icon': 'activityBar.foreground',
  'icon.accent': 'icon.foreground',
  'icon.muted': 'activityBar.inactiveForeground',
  'icon.disabled': 'activityBar.inactiveForeground',
  'icon.placeholder': 'input.placeholderForeground',
  'status_bar.background': 'statusBar.background',
  'title_bar.background': 'titleBar.activeBackground',
  'title_bar.inactive_background': 'titleBar.activeBackground',
  'toolbar.background': 'breadcrumb.background',
  'tab_bar.background': 'editorGroupHeader.tabsBackground',
  'tab.active_background': 'tab.activeBackground',
  'tab.inactive_background': 'tab.inactiveBackground',
  'panel.background': 'sideBar.background',
  'panel.focused_border': 'activityBar.activeFocusBorder',
  'pane.focused_border': 'activityBar.activeFocusBorder',
  'pane_group.border': 'editorGroup.border',
  'scrollbar.thumb.background': 'scrollbarSlider.background',
  'scrollbar.thumb.hover_background': 'scrollbarSlider.hoverBackground',
  'scrollbar.thumb.border': 'editorGroup.border',
  'scrollbar.track.background': 'editor.background',
  'scrollbar.track.border': 'editor.background',
  'editor.background': 'editor.background',
  'editor.foreground': 'editor.foreground',
  'editor.gutter.background': 'editor.background',
  'editor.subheader.background': 'editorWidget.background',
  'editor.active_line.background': 'editor.lineHighlightBackground',
  'editor.highlighted_line.background': 'editor.hoverHighlightBackground',
  'editor.line_number': 'editorLineNumber.foreground',
  'editor.active_line_number': 'editorLineNumber.activeForeground',
  'editor.indent_guide': 'editorIndentGuide.background',
  'editor.indent_guide_active': 'editorIndentGuide.activeBackground',
  'editor.wrap_guide': 'editorGroup.border',
  'editor.active_wrap_guide': 'editorIndentGuide.activeBackground',
  'editor.document_highlight.read_background': 'editor.selectionHighlightBackground',
  'editor.document_highlight.write_background': 'editor.wordHighlightStrongBackground',
  'editor.document_highlight.bracket_background': 'editorBracketMatch.background',
  'search.match_background': 'editor.findMatchBackground',
  'terminal.background': 'terminal.background',
  'terminal.foreground': 'terminal.foreground',
  'link_text.hover': 'editorLink.activeForeground',
};
for (const [zed, vscode] of Object.entries(mapping)) {
  if (!c[vscode]) throw new Error(`Missing source color: ${vscode}`);
  style[zed] = c[vscode];
}
Object.assign(style, {
  'background.appearance': 'opaque',
  'border.transparent': '#00000000',
  'ghost_element.background': '#00000000',
  'drop_target.background': '#383b3d80',
  'editor.invisible': '#64666780',
  'terminal.ansi.background': '#000000',
  'terminal.bright_foreground': '#fff799',
  'terminal.dim_foreground': '#acacae',
  accents: ['#f49f31', '#4dc7f9', '#5dc453', '#8c6eaf', '#fee334', '#d54135'],
  players: [{ cursor: c['editorCursor.foreground'], background: c['editorCursor.foreground'], selection: c['editor.selectionBackground'] }],
});
// Berg leaves ANSI and diagnostics mostly unspecified. Fill these using its palette.
const ansi = { black: '#202020', red: '#d54135', green: '#5dc453', yellow: '#f49f31', blue: '#6d96d0', magenta: '#8c6eaf', cyan: '#4dc7f9', white: '#d7d7d7' };
const bright = { black: '#646667', red: '#f44747', green: '#60c487', yellow: '#fee334', blue: '#6796e6', magenta: '#da9bff', cyan: '#abd3e0', white: '#ffffff' };
for (const [name, color] of Object.entries(ansi)) {
  style[`terminal.ansi.${name}`] = color;
  style[`terminal.ansi.bright_${name}`] = bright[name];
  style[`terminal.ansi.dim_${name}`] = '#' + color.slice(1).match(/../g).map(v => Math.round(parseInt(v, 16) * 0.7).toString(16).padStart(2, '0')).join('');
}
for (const [name, color] of Object.entries({ conflict: '#8c6eaf', created: '#5dc453', deleted: '#d54135', error: '#f44747', hidden: '#646667', hint: '#acacae', ignored: '#646667', info: '#6796e6', modified: '#f49f31', predictive: '#646667', renamed: '#4dc7f9', success: '#5dc453', unreachable: '#646667', warning: '#cd9731' })) {
  style[name] = color;
  style[`${name}.background`] = color + '20';
  style[`${name}.border`] = color + '80';
}

// Resolve simple TextMate scopes by specificity, then source order. Complex selectors
// are deliberately excluded: Zed uses Tree-sitter captures, not TextMate scopes.
function token(scope) {
  let result = {}, specificity = -1;
  for (const rule of source.tokenColors) {
    for (const selector of [rule.scope].flat()) {
      if (!selector || /[ ,\-]/.test(selector)) continue;
      if ((scope === selector || scope.startsWith(selector + '.')) && selector.length >= specificity) {
        result = { ...result, ...rule.settings };
        specificity = selector.length;
      }
    }
  }
  const out = { color: result.foreground || c['editor.foreground'], font_style: 'normal', font_weight: 400 };
  if (result.fontStyle?.includes('italic')) out.font_style = 'italic';
  if (result.fontStyle?.includes('bold')) out.font_weight = 700;
  return out;
}
const captures = {
  attribute: 'entity.other.attribute-name', boolean: 'constant.language',
  comment: 'comment', 'comment.doc': 'comment', constant: 'variable.other.constant',
  constructor: 'entity.name.type', embedded: 'meta.embedded',
  emphasis: 'markup.italic.markdown', 'emphasis.strong': 'markup.bold',
  enum: 'entity.name.type', function: 'entity.name.function',
  'function.method': 'entity.name.function', 'function.builtin': 'support.function',
  hint: 'token.info-token', keyword: 'keyword', label: 'entity.name.label',
  link_text: 'markup.underline.link', link_uri: 'markup.underline.link',
  namespace: 'entity.name.namespace', number: 'constant.numeric', operator: 'keyword.operator',
  parameter: 'variable.parameter', preproc: 'meta.preprocessor', property: 'meta.object-literal.key',
  punctuation: 'meta.embedded', 'punctuation.bracket': 'meta.embedded',
  'punctuation.delimiter': 'meta.embedded', 'punctuation.list_marker': 'punctuation.definition.list.begin.markdown',
  'punctuation.special': 'punctuation.definition.template-expression.begin',
  string: 'string', 'string.escape': 'constant.character.escape', 'string.regex': 'string.regexp',
  'string.special': 'string', 'string.special.symbol': 'variable.other.constant',
  tag: 'entity.name.tag.html', 'text.literal': 'markup.inline.raw',
  title: 'markup.heading.markdown', type: 'entity.name.type', 'type.builtin': 'storage.type',
  variable: 'variable', 'variable.special': 'variable.language',
  variant: 'variable.other.enummember', 'text': 'text',
};
style.syntax = Object.fromEntries(Object.entries(captures).map(([capture, scope]) => [capture, token(scope)]));
style.syntax.link_text.color = '#6d96d0';
style.syntax.link_uri.color = '#6d96d0';
fs.mkdirSync(path.join(root, 'themes'), { recursive: true });
fs.writeFileSync(path.join(root, 'themes/berg.json'), JSON.stringify({
  $schema: 'https://zed.dev/schema/themes/v0.2.0.json',
  name: 'Berg', author: 'jx22 (original Berg theme); Zed port',
  themes: [{ name: 'Berg', appearance: 'dark', style }],
}, null, 2) + '\n');
console.log(`Built themes/berg.json (${Object.keys(style.syntax).length} syntax captures).`);
