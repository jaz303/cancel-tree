module.exports = createCancellableContext;

function createCancellableContext() {
    let cancelled = false, cancel = [], children = [];

    return {
        guard: _guard,

        cancel() {
            if (!cancelled) {
                cancelled = true;
                children.forEach(c => c.cancel());
                cancel.forEach(fn => {
                    try {
                        fn();
                    } catch (err) {
                        console.error("Caught error while processing cancellation");
                    }
                });
                cancel = children = null;
            }
        },
        push(fn) {
            _assertNotCancelled();
            cancel.push(fn);
        },
        beget() {
            _assertNotCancelled();
            const newContext = createCancellableContext();
            children.push(newContext);
            return newContext;
        },
        setTimeout(cb, delay, ...args) {
            _assertNotCancelled();
            return setTimeout(_guard(cb), delay, ...args);
        },
        clearTimeout(id) {
            clearTimeout(id);
        },
        setInterval(...args) {
            _assertNotCancelled();
            const id = setInterval(...args);
            cancel.push(() => clearInterval(id));
            return id;
        },
        clearInterval(id) {
            clearInterval(id);
        }
    };

    function _guard(fn, ctx) {
        ctx = ctx || null;
        return function() {
            if (!cancelled) {
                fn.apply(ctx, arguments);
            }
        }
    }

    function _assertNotCancelled() {
        if (cancelled) {
            throw new Error("Cannot perform this operation after cancellation");
        }
    }
}