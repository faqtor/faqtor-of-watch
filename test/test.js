(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.undoredo = factory());
}(this, (function () { 'use strict';

    /** Class that implements all functionality of history. */
    var Hist = /** @class */ (function () {
        function Hist(depth) {
            this.depth_ = depth;
            this.list_ = [];
            this.offset_ = 0;
        }
        Object.defineProperty(Hist.prototype, "UndoLength", {
            /** Length of undoing history. */
            get: function () { return this.list_.length - this.offset_; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Hist.prototype, "RedoLength", {
            /** Length of redoing history. */
            get: function () { return this.offset_; },
            enumerable: true,
            configurable: true
        });
        /** Add new record to a history, then `r.Redo()` will be called automatically. */
        Hist.prototype.add = function (r) {
            var lst = this.list_.slice(0, this.list_.length - this.offset_);
            if (lst.length === this.depth_) {
                lst = lst.splice(0, 1);
            }
            if (lst.length === this.depth_)
                return;
            lst.push(r);
            this.offset_ = 0;
            this.list_ = lst;
            r.Redo();
        };
        /** Undo the last record in a history. */
        Hist.prototype.undo = function () {
            if (this.list_.length) {
                var maxOffset = this.list_.length - 1;
                if (this.offset_ <= maxOffset) {
                    this.list_[maxOffset - this.offset_].Undo();
                    this.offset_++;
                }
            }
        };
        /** Redo last undone record and return it back to the history. */
        Hist.prototype.redo = function () {
            if (this.list_.length) {
                var maxOffset = this.list_.length - 1;
                if (this.offset_ > 0) {
                    this.offset_--;
                    this.list_[maxOffset - this.offset_].Redo();
                }
            }
        };
        /** Clean the history. */
        Hist.prototype.clean = function () {
            this.list_ = [];
            this.offset_ = 0;
        };
        return Hist;
    }());

    return Hist;

})));
//# sourceMappingURL=undoredo.umd.js.map
