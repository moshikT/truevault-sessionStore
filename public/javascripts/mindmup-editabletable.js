/*global $, window*/
$.fn.editableTableWidget = function (options) {
    'use strict';
    return $(this).each(function () {
        var buildDefaultOptions = function () {
                var opts = $.extend({}, $.fn.editableTableWidget.defaultOptions);
                opts.editor.forEach(function(element) {
                    element.clone();
                });
                return opts;
            },
            activeOptions = $.extend(buildDefaultOptions(), options),
            ARROW_LEFT = 37, ARROW_UP = 38, ARROW_RIGHT = 39, ARROW_DOWN = 40, ENTER = 13, ESC = 27, TAB = 9,
            element = $(this),
            myEditor,
            editor = [],
            active,
            showEditor = function (select) {
                active = element.find('td:focus');
                if (active.length) {

                    // Prevent edit of the columns specified
                    if ($.inArray(active.index() + 1, activeOptions.preventColumns) != -1) {
                        active.blur();
                        return;
                    }

                    myEditor = editor[0];
                    if (active.data('editor')) {
                        myEditor = editor[active.data('editor')];
                    }
                    myEditor.blur(blurFunc).keydown(keydownFunc).on('input paste', onInputPasteFunc);
                    myEditor.val(active.text())
                        .removeClass('error')
                        .show()
                        .offset(active.offset())
                        .css(active.css(activeOptions.cloneProperties))
                        .width(active.width())
                        .height(active.height())
                        .focus();
                    if (select) {
                        myEditor.select();
                    }
                }
            },
            setActiveText = function () {
                var text = myEditor.val(),
                    evt = $.Event('change'),
                    originalContent;
                if (active.text() === text || myEditor.hasClass('error')) {
                    return true;
                }
                originalContent = active.html();
                active.text(text).trigger(evt, text);
                if (evt.result === false) {
                    active.html(originalContent);
                }
            },
            movement = function (element, keycode) {
                if (keycode === ARROW_RIGHT) {
                    return element.next('td');
                } else if (keycode === ARROW_LEFT) {
                    return element.prev('td');
                } else if (keycode === ARROW_UP) {
                    return element.parent().prev().children().eq(element.index());
                } else if (keycode === ARROW_DOWN) {
                    return element.parent().next().children().eq(element.index());
                }
                return [];
            };
            activeOptions.editor.forEach(function(editorElement) {
                editor.push(editorElement.css('position', 'absolute').hide().appendTo(element.parent()));
            });
        function blurFunc() {
            setActiveText();
            myEditor.hide();
        }
        function keydownFunc(e) {
            if (e.which === ENTER) {
                setActiveText();
                myEditor.hide();
                active.focus();
                e.preventDefault();
                e.stopPropagation();
            } else if (e.which === ESC) {
                myEditor.val(active.text());
                e.preventDefault();
                e.stopPropagation();
                myEditor.hide();
                active.focus();
            } else if (e.which === TAB) {
                active.focus();
            } else if (this.selectionEnd - this.selectionStart === this.value.length) {
                var possibleMove = movement(active, e.which);
                if (possibleMove.length > 0) {
                    possibleMove.focus();
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        }
        function onInputPasteFunc() {
                var evt = $.Event('validate');
                active.trigger(evt, myEditor.val());
                if (evt.result === false) {
                    myEditor.addClass('error');
                } else {
                    myEditor.removeClass('error');
                }
            }
        element.on('click keypress dblclick', showEditor)
            .css('cursor', 'pointer')
            .keydown(function (e) {
                var prevent = true,
                    possibleMove = movement($(e.target), e.which);
                if (possibleMove.length > 0) {
                    possibleMove.focus();
                } else if (e.which === ENTER) {
                    showEditor(false);
                } else if (e.which === 17 || e.which === 91 || e.which === 93) {
                    showEditor(true);
                    prevent = false;
                } else {
                    prevent = false;
                }
                if (prevent) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            });

        element.find('td').prop('tabindex', 1);

        $(window).on('resize', function () {
            if (myEditor.is(':visible')) {
                myEditor.offset(active.offset())
                    .width(active.width())
                    .height(active.height());
            }
        });
    });

};
$.fn.editableTableWidget.defaultOptions = {
    cloneProperties: ['padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
        'text-align', 'font', 'font-size', 'font-family', 'font-weight',
        'border', 'border-top', 'border-bottom', 'border-left', 'border-right'],
    editor: [$('<input>')]
};


