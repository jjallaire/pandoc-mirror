var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "orderedmap", "prosemirror-inputrules", "prosemirror-keymap", "prosemirror-model", "prosemirror-state", "prosemirror-view", "editor/pandoc/converter", "./extensions", "prosemirror-view/style/prosemirror.css", "./styles/prosemirror.css"], function (require, exports, orderedmap_1, prosemirror_inputrules_1, prosemirror_keymap_1, prosemirror_model_1, prosemirror_state_1, prosemirror_view_1, converter_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    orderedmap_1 = __importDefault(orderedmap_1);
    exports.kEventUpdate = 'update';
    exports.kEventSelectionChange = 'selectionChange';
    var kMac = typeof navigator !== 'undefined' ? /Mac/.test(navigator.platform) : false;
    var Editor = /** @class */ (function () {
        function Editor(config) {
            var _this = this;
            // initialize references
            this.parent = config.parent;
            this.ui = config.ui;
            this.options = config.options || {};
            this.keybindings = config.keybindings || {};
            this.hooks = config.hooks || {};
            // initialize custom events
            this.events = this.initEvents();
            // create extensions
            this.extensions = extensions_1.initExtensions(config);
            // create schema
            this.schema = this.initSchema();
            // create state
            this.state = prosemirror_state_1.EditorState.create({
                schema: this.schema,
                doc: this.emptyDoc(),
                plugins: this.createPlugins(),
            });
            // create view
            this.view = new prosemirror_view_1.EditorView(this.parent, {
                state: this.state,
                dispatchTransaction: this.dispatchTransaction.bind(this),
            });
            // create pandoc translator
            this.pandocConverter = new converter_1.PandocConverter(this.schema, this.extensions.pandocReaders(), this.extensions.pandocNodeWriters(), this.extensions.pandocMarkWriters(), config.pandoc, {
                reader: {},
                writer: {
                    atxHeaders: true,
                    wrapColumn: 100,
                },
            });
            // apply devtools if they are available
            if (this.hooks.applyDevTools) {
                this.hooks.applyDevTools(this.view, { EditorState: prosemirror_state_1.EditorState });
            }
            // focus editor immediately if requested
            if (this.options.autoFocus) {
                setTimeout(function () {
                    _this.focus();
                }, 10);
            }
        }
        Editor.prototype.destroy = function () {
            this.view.destroy();
        };
        Editor.prototype.subscribe = function (event, handler) {
            var _this = this;
            if (!this.events.has(event)) {
                var valid = Array.from(this.events.keys()).join(', ');
                throw new Error("Unknown event " + event + ". Valid events are " + valid);
            }
            this.parent.addEventListener(event, handler);
            return function () {
                _this.parent.removeEventListener(event, handler);
            };
        };
        Editor.prototype.setMarkdown = function (markdown, emitUpdate) {
            var _this = this;
            if (emitUpdate === void 0) { emitUpdate = true; }
            return this.pandocConverter.toProsemirror(markdown).then(function (doc) {
                // re-initialize editor state
                _this.state = prosemirror_state_1.EditorState.create({
                    schema: _this.state.schema,
                    doc: doc,
                    plugins: _this.state.plugins,
                });
                _this.view.updateState(_this.state);
                // notify listeners if requested
                if (emitUpdate) {
                    _this.emitEvent(exports.kEventUpdate);
                    _this.emitEvent(exports.kEventSelectionChange);
                }
            });
        };
        Editor.prototype.getMarkdown = function () {
            return this.pandocConverter.fromProsemirror(this.state.doc);
        };
        Editor.prototype.focus = function () {
            this.view.focus();
        };
        Editor.prototype.blur = function () {
            this.view.dom.blur();
        };
        Editor.prototype.commands = function () {
            var _this = this;
            // get keybindings (merge user + default)
            var commandKeys = this.commandKeys();
            return this.extensions
                .commands(this.schema, this.ui, kMac)
                .reduce(function (commands, command) {
                var _a;
                return __assign(__assign({}, commands), (_a = {}, _a[command.name] = {
                    name: command.name,
                    keymap: commandKeys[command.name],
                    isActive: function () { return command.isActive(_this.state); },
                    isEnabled: function () { return command.isEnabled(_this.state); },
                    execute: function () { return command.execute(_this.state, _this.view.dispatch, _this.view); },
                }, _a));
            }, {});
        };
        Editor.prototype.setKeybindings = function (keyBindings) {
            this.keybindings = keyBindings;
            this.state = this.state.reconfigure({
                schema: this.state.schema,
                plugins: this.createPlugins()
            });
        };
        Editor.prototype.dispatchTransaction = function (transaction) {
            // apply the transaction
            this.state = this.state.apply(transaction);
            this.view.updateState(this.state);
            // notify listeners of selection change
            this.emitEvent(exports.kEventSelectionChange);
            // notify listeners of updates
            if (transaction.docChanged) {
                this.emitEvent(exports.kEventUpdate);
            }
        };
        Editor.prototype.emitEvent = function (name) {
            var event = this.events.get(name);
            if (event) {
                this.parent.dispatchEvent(event);
            }
        };
        Editor.prototype.initEvents = function () {
            var events = new Map();
            events.set(exports.kEventUpdate, new Event(exports.kEventUpdate));
            events.set(exports.kEventSelectionChange, new Event(exports.kEventSelectionChange));
            return events;
        };
        Editor.prototype.initSchema = function () {
            // build in doc node + nodes from extensions
            var nodes = {
                doc: {
                    content: 'body notes',
                },
                body: {
                    content: 'block+',
                    defining: true,
                    isolating: true,
                    parseDOM: [{ tag: 'div[class="body"]' }],
                    toDOM: function () {
                        return ['div', { class: 'body' }, 0];
                    },
                },
                notes: {
                    content: 'note*',
                    parseDOM: [{ tag: 'div[class="notes"]' }],
                    toDOM: function () {
                        return ['div', { class: 'notes' }, 0];
                    },
                },
                note: {
                    content: 'block+',
                    attrs: {
                        ref: {},
                        number: { default: 1 },
                    },
                    defining: true,
                    isolating: true,
                    parseDOM: [
                        {
                            tag: 'div[class="note"]',
                            getAttrs: function (dom) {
                                var el = dom;
                                return {
                                    ref: el.getAttribute('data-ref'),
                                };
                            },
                        },
                    ],
                    toDOM: function (node) {
                        return ['div', { 'data-ref': node.attrs.ref, class: 'note', 'data-number': node.attrs.number }, 0];
                    },
                },
            };
            this.extensions.pandocNodes().forEach(function (node) {
                nodes[node.name] = node.spec;
            });
            // marks from extensions
            var marks = {};
            this.extensions.pandocMarks().forEach(function (mark) {
                marks[mark.name] = mark.spec;
            });
            // return schema
            return new prosemirror_model_1.Schema({
                nodes: orderedmap_1.default.from(nodes),
                marks: orderedmap_1.default.from(marks),
            });
        };
        Editor.prototype.createPlugins = function () {
            return __spreadArrays([
                this.keybindingsPlugin()
            ], this.extensions.plugins(this.schema, this.ui, kMac), [
                prosemirror_inputrules_1.inputRules({ rules: this.extensions.inputRules(this.schema) }),
                new prosemirror_state_1.Plugin({
                    key: new prosemirror_state_1.PluginKey('editable'),
                    props: {
                        editable: this.hooks.isEditable || (function () { return true; }),
                    },
                }),
            ]);
        };
        Editor.prototype.keybindingsPlugin = function () {
            // get keybindings (merge user + default)
            var commandKeys = this.commandKeys();
            // command keys from extensions
            var pluginKeys = {};
            var commands = this.extensions.commands(this.schema, this.ui, kMac);
            commands.forEach(function (command) {
                var keys = commandKeys[command.name];
                if (keys) {
                    keys.forEach(function (key) {
                        pluginKeys[key] = command.execute;
                    });
                }
            });
            // return plugin
            return new prosemirror_state_1.Plugin({
                key: Editor.keybindingsPlugin,
                props: {
                    handleKeyDown: prosemirror_keymap_1.keydownHandler(pluginKeys)
                }
            });
        };
        Editor.prototype.commandKeys = function () {
            // start with keys provided within command definitions
            var commands = this.extensions.commands(this.schema, this.ui, kMac);
            var defaultKeys = commands.reduce(function (keys, command) {
                keys[command.name] = command.keymap;
                return keys;
            }, {});
            // merge with user keybindings
            return __assign(__assign({}, defaultKeys), this.keybindings);
        };
        Editor.prototype.emptyDoc = function () {
            return this.schema.nodeFromJSON({
                type: 'doc',
                content: [
                    {
                        type: 'paragraph',
                    },
                ],
            });
        };
        Editor.keybindingsPlugin = new prosemirror_state_1.PluginKey('keybindings');
        return Editor;
    }());
    exports.Editor = Editor;
});
//# sourceMappingURL=editor.js.map