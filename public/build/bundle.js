
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Title.svelte generated by Svelte v3.59.1 */
    const file$4 = "src\\Title.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (66:2) {#if displayedMessage}
    function create_if_block(ctx) {
    	let each_1_anchor;
    	let each_value = /*currentMessage*/ ctx[0].split('message');
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*currentMessage, displayedMessage*/ 3) {
    				each_value = /*currentMessage*/ ctx[0].split('message');
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(66:2) {#if displayedMessage}",
    		ctx
    	});

    	return block;
    }

    // (70:6) {:else}
    function create_else_block(ctx) {
    	let t_value = /*part*/ ctx[6] + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*currentMessage*/ 1 && t_value !== (t_value = /*part*/ ctx[6] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(70:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (68:6) {#if i > 0}
    function create_if_block_1(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*part*/ ctx[6] + "";
    	let t1;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(/*displayedMessage*/ ctx[1]);
    			t1 = text(t1_value);
    			attr_dev(span, "class", "highlight svelte-1fh8ml0");
    			add_location(span, file$4, 68, 8, 1707);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*displayedMessage*/ 2) set_data_dev(t0, /*displayedMessage*/ ctx[1]);
    			if (dirty & /*currentMessage*/ 1 && t1_value !== (t1_value = /*part*/ ctx[6] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(68:6) {#if i > 0}",
    		ctx
    	});

    	return block;
    }

    // (67:4) {#each currentMessage.split('message') as part, i}
    function create_each_block(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*i*/ ctx[8] > 0) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(67:4) {#each currentMessage.split('message') as part, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let if_block = /*displayedMessage*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "container svelte-1fh8ml0");
    			add_location(div, file$4, 64, 0, 1573);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*displayedMessage*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Title', slots, []);
    	let index = 0;

    	const messages = [
    		'out.println("message")',
    		'console.log("message");',
    		'cout << "message";',
    		'print("message")',
    		'puts "message"',
    		'echo "message"'
    	];

    	let currentMessage = messages[index];
    	let message = 'Welcome to ACSL Club!';
    	let displayedMessage = '';
    	let typingTimer;

    	onMount(() => {
    		let messageSwitchTimer;

    		if (!displayedMessage) {
    			let i = 0;

    			typingTimer = setInterval(
    				() => {
    					if (i < message.length) {
    						$$invalidate(1, displayedMessage = message.substring(0, i + 1));
    						i++;
    					} else {
    						clearInterval(typingTimer);
    					}
    				},
    				Math.random() * 300 + 100
    			); // typing speed
    		}

    		messageSwitchTimer = setInterval(
    			() => {
    				index = (index + 1) % messages.length;
    				$$invalidate(0, currentMessage = messages[index]);
    			},
    			5000
    		);

    		return () => {
    			clearInterval(typingTimer);
    			clearInterval(messageSwitchTimer);
    		};
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Title> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		index,
    		messages,
    		currentMessage,
    		message,
    		displayedMessage,
    		typingTimer
    	});

    	$$self.$inject_state = $$props => {
    		if ('index' in $$props) index = $$props.index;
    		if ('currentMessage' in $$props) $$invalidate(0, currentMessage = $$props.currentMessage);
    		if ('message' in $$props) message = $$props.message;
    		if ('displayedMessage' in $$props) $$invalidate(1, displayedMessage = $$props.displayedMessage);
    		if ('typingTimer' in $$props) typingTimer = $$props.typingTimer;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentMessage, displayedMessage];
    }

    class Title extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\ScrollDown.svelte generated by Svelte v3.59.1 */

    const file$3 = "src\\ScrollDown.svelte";

    function create_fragment$3(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "⮟";
    			attr_dev(button, "class", "scroll-down-btn svelte-1oqg269");
    			add_location(button, file$3, 8, 0, 235);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", scrollDown, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function scrollDown() {
    	let descriptionElement = document.getElementById("description");

    	if (descriptionElement) {
    		descriptionElement.scrollIntoView({ behavior: "smooth" });
    	}
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ScrollDown', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ScrollDown> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ scrollDown });
    	return [];
    }

    class ScrollDown extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ScrollDown",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\Navbar.svelte generated by Svelte v3.59.1 */

    const file$2 = "src\\Navbar.svelte";

    function create_fragment$2(ctx) {
    	let nav;
    	let ul;
    	let li0;
    	let button0;
    	let t1;
    	let li1;
    	let button1;
    	let t3;
    	let li2;
    	let button2;
    	let t5;
    	let li3;
    	let button3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			button0 = element("button");
    			button0.textContent = "Discover ACSL";
    			t1 = space();
    			li1 = element("li");
    			button1 = element("button");
    			button1.textContent = "Introducing ACSL Club";
    			t3 = space();
    			li2 = element("li");
    			button2 = element("button");
    			button2.textContent = "Our Activities";
    			t5 = space();
    			li3 = element("li");
    			button3 = element("button");
    			button3.textContent = "Time Commitment";
    			attr_dev(button0, "class", "svelte-1i9pi1a");
    			add_location(button0, file$2, 12, 8, 269);
    			attr_dev(li0, "class", "svelte-1i9pi1a");
    			add_location(li0, file$2, 11, 6, 255);
    			attr_dev(button1, "class", "svelte-1i9pi1a");
    			add_location(button1, file$2, 15, 8, 377);
    			attr_dev(li1, "class", "svelte-1i9pi1a");
    			add_location(li1, file$2, 14, 6, 363);
    			attr_dev(button2, "class", "svelte-1i9pi1a");
    			add_location(button2, file$2, 18, 8, 501);
    			attr_dev(li2, "class", "svelte-1i9pi1a");
    			add_location(li2, file$2, 17, 6, 487);
    			attr_dev(button3, "class", "svelte-1i9pi1a");
    			add_location(button3, file$2, 21, 8, 611);
    			attr_dev(li3, "class", "svelte-1i9pi1a");
    			add_location(li3, file$2, 20, 6, 597);
    			attr_dev(ul, "class", "svelte-1i9pi1a");
    			add_location(ul, file$2, 10, 4, 243);
    			attr_dev(nav, "class", "navbar svelte-1i9pi1a");
    			add_location(nav, file$2, 9, 2, 217);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, button0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(li1, button1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, button2);
    			append_dev(ul, t5);
    			append_dev(ul, li3);
    			append_dev(li3, button3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[0], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[1], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[2], false, false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[3], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function scrollTo(elementId) {
    	let element = document.getElementById(elementId);

    	if (element) {
    		element.scrollIntoView({ behavior: "smooth" });
    	}
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navbar', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => scrollTo('discover-acsl');
    	const click_handler_1 = () => scrollTo('introducing-acsl-club');
    	const click_handler_2 = () => scrollTo('our-activities');
    	const click_handler_3 = () => scrollTo('time-commitment');
    	$$self.$capture_state = () => ({ scrollTo });
    	return [click_handler, click_handler_1, click_handler_2, click_handler_3];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Description.svelte generated by Svelte v3.59.1 */

    const file$1 = "src\\Description.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let span2;
    	let t5;
    	let span3;
    	let t7;
    	let span4;
    	let t9;
    	let span5;
    	let t11;
    	let span6;
    	let t13;
    	let span7;
    	let t15;
    	let section0;
    	let h10;
    	let t17;
    	let p0;
    	let t19;
    	let section1;
    	let h11;
    	let t21;
    	let p1;
    	let t23;
    	let section2;
    	let h12;
    	let t25;
    	let p2;
    	let t27;
    	let section3;
    	let h13;
    	let t29;
    	let p3;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "A";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "merican";
    			t3 = space();
    			span2 = element("span");
    			span2.textContent = "C";
    			t5 = space();
    			span3 = element("span");
    			span3.textContent = "omputer";
    			t7 = space();
    			span4 = element("span");
    			span4.textContent = "S";
    			t9 = space();
    			span5 = element("span");
    			span5.textContent = "cience";
    			t11 = space();
    			span6 = element("span");
    			span6.textContent = "L";
    			t13 = space();
    			span7 = element("span");
    			span7.textContent = "eague";
    			t15 = space();
    			section0 = element("section");
    			h10 = element("h1");
    			h10.textContent = "Discover ACSL";
    			t17 = space();
    			p0 = element("p");
    			p0.textContent = "The American Computer Science League (ACSL) organizes computer\r\n        programming and computer science contests for K-12 students, bridging\r\n        schools, organizations, and local groups. ACSL offers a form of\r\n        competitive programming that is less competitive than USACO, featuring\r\n        multiple choice and programming questions to challenge your skills.";
    			t19 = space();
    			section1 = element("section");
    			h11 = element("h1");
    			h11.textContent = "Introducing ACSL Club";
    			t21 = space();
    			p1 = element("p");
    			p1.textContent = "The ACSL Club is an initiative by a group of enthusiastic students with\r\n        a mission to foster competitive programming within high school.";
    			t23 = space();
    			section2 = element("section");
    			h12 = element("h1");
    			h12.textContent = "Our Activities";
    			t25 = space();
    			p2 = element("p");
    			p2.textContent = "Our club conducts weekly meetings where we cover the fundamentals of\r\n        competitive programming and equip you for ACSL contests.";
    			t27 = space();
    			section3 = element("section");
    			h13 = element("h1");
    			h13.textContent = "Time Commitment";
    			t29 = space();
    			p3 = element("p");
    			p3.textContent = "We understand that you have a busy schedule. The weekly meetings are 20 minutes long and are held at lunch (also optional).\r\n        The competition time usually takes 3 hours and the time is flexible.";
    			attr_dev(span0, "class", "bigLogo svelte-gbxp13");
    			add_location(span0, file$1, 6, 6, 122);
    			attr_dev(span1, "class", "smallLogo svelte-gbxp13");
    			add_location(span1, file$1, 7, 6, 160);
    			attr_dev(span2, "class", "bigLogo svelte-gbxp13");
    			add_location(span2, file$1, 8, 6, 206);
    			attr_dev(span3, "class", "smallLogo svelte-gbxp13");
    			add_location(span3, file$1, 9, 6, 244);
    			attr_dev(span4, "class", "bigLogo svelte-gbxp13");
    			add_location(span4, file$1, 10, 6, 290);
    			attr_dev(span5, "class", "smallLogo svelte-gbxp13");
    			add_location(span5, file$1, 11, 6, 328);
    			attr_dev(span6, "class", "bigLogo svelte-gbxp13");
    			add_location(span6, file$1, 12, 6, 373);
    			attr_dev(span7, "class", "smallLogo svelte-gbxp13");
    			add_location(span7, file$1, 13, 6, 411);
    			attr_dev(div0, "class", "logo-section svelte-gbxp13");
    			add_location(div0, file$1, 5, 4, 88);
    			attr_dev(h10, "class", "svelte-gbxp13");
    			add_location(h10, file$1, 16, 6, 501);
    			attr_dev(p0, "class", "svelte-gbxp13");
    			add_location(p0, file$1, 17, 6, 531);
    			attr_dev(section0, "id", "discover-acsl");
    			attr_dev(section0, "class", "svelte-gbxp13");
    			add_location(section0, file$1, 15, 4, 465);
    			attr_dev(h11, "class", "svelte-gbxp13");
    			add_location(h11, file$1, 26, 6, 993);
    			attr_dev(p1, "class", "svelte-gbxp13");
    			add_location(p1, file$1, 27, 6, 1031);
    			attr_dev(section1, "id", "introducing-acsl-club");
    			attr_dev(section1, "class", "svelte-gbxp13");
    			add_location(section1, file$1, 25, 4, 949);
    			attr_dev(h12, "class", "svelte-gbxp13");
    			add_location(h12, file$1, 33, 6, 1259);
    			attr_dev(p2, "class", "svelte-gbxp13");
    			add_location(p2, file$1, 34, 6, 1290);
    			attr_dev(section2, "id", "our-activities");
    			attr_dev(section2, "class", "svelte-gbxp13");
    			add_location(section2, file$1, 32, 4, 1222);
    			attr_dev(h13, "class", "svelte-gbxp13");
    			add_location(h13, file$1, 40, 6, 1509);
    			attr_dev(p3, "class", "svelte-gbxp13");
    			add_location(p3, file$1, 41, 6, 1541);
    			attr_dev(section3, "id", "time-commitment");
    			attr_dev(section3, "class", "svelte-gbxp13");
    			add_location(section3, file$1, 39, 4, 1471);
    			attr_dev(div1, "id", /*id*/ ctx[0]);
    			attr_dev(div1, "class", "description svelte-gbxp13");
    			add_location(div1, file$1, 4, 2, 49);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span0);
    			append_dev(div0, t1);
    			append_dev(div0, span1);
    			append_dev(div0, t3);
    			append_dev(div0, span2);
    			append_dev(div0, t5);
    			append_dev(div0, span3);
    			append_dev(div0, t7);
    			append_dev(div0, span4);
    			append_dev(div0, t9);
    			append_dev(div0, span5);
    			append_dev(div0, t11);
    			append_dev(div0, span6);
    			append_dev(div0, t13);
    			append_dev(div0, span7);
    			append_dev(div1, t15);
    			append_dev(div1, section0);
    			append_dev(section0, h10);
    			append_dev(section0, t17);
    			append_dev(section0, p0);
    			append_dev(div1, t19);
    			append_dev(div1, section1);
    			append_dev(section1, h11);
    			append_dev(section1, t21);
    			append_dev(section1, p1);
    			append_dev(div1, t23);
    			append_dev(div1, section2);
    			append_dev(section2, h12);
    			append_dev(section2, t25);
    			append_dev(section2, p2);
    			append_dev(div1, t27);
    			append_dev(div1, section3);
    			append_dev(section3, h13);
    			append_dev(section3, t29);
    			append_dev(section3, p3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*id*/ 1) {
    				attr_dev(div1, "id", /*id*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Description', slots, []);
    	let { id } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (id === undefined && !('id' in $$props || $$self.$$.bound[$$self.$$.props['id']])) {
    			console.warn("<Description> was created without expected prop 'id'");
    		}
    	});

    	const writable_props = ['id'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Description> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({ id });

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [id];
    }

    class Description extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { id: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Description",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get id() {
    		throw new Error("<Description>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Description>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.59.1 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let navbar;
    	let t0;
    	let title;
    	let t1;
    	let scrolldown;
    	let t2;
    	let description;
    	let current;
    	navbar = new Navbar({ $$inline: true });
    	title = new Title({ $$inline: true });
    	scrolldown = new ScrollDown({ $$inline: true });

    	description = new Description({
    			props: { id: "description" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			create_component(title.$$.fragment);
    			t1 = space();
    			create_component(scrolldown.$$.fragment);
    			t2 = space();
    			create_component(description.$$.fragment);
    			attr_dev(main, "class", "app-container svelte-uloi94");
    			add_location(main, file, 6, 0, 203);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(navbar, main, null);
    			append_dev(main, t0);
    			mount_component(title, main, null);
    			append_dev(main, t1);
    			mount_component(scrolldown, main, null);
    			append_dev(main, t2);
    			mount_component(description, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(title.$$.fragment, local);
    			transition_in(scrolldown.$$.fragment, local);
    			transition_in(description.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(title.$$.fragment, local);
    			transition_out(scrolldown.$$.fragment, local);
    			transition_out(description.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navbar);
    			destroy_component(title);
    			destroy_component(scrolldown);
    			destroy_component(description);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Title, ScrollDown, Navbar, Description });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
