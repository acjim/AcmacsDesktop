'use strict';

describe("Toolbar test suite", function() {

    var toolbar,
        expectedItem = {
            id: 4,
            caption: 'Selection',
            active: true,
            groupID: 1,
            icon: 'glyphicon glyphicon-unchecked',
            callback: function () {
                return 999;
            }
        },
        otherItem = {
            id: 10,
            caption: 'Test',
            active: false,
            icon: 'glyphicon glyphicon-unchecked',
            callback: function () {
                return 999;
            }
        };

    beforeEach(function() {
        //Ensure angular modules available
        module('acjim.toolbar');

        inject(function(_toolbar_) {
            toolbar = _toolbar_;
        });
    });

    it('can get an instance of the toolbar factory', function() {
        expect(toolbar).toBeDefined();
    });


    it("should return item by its id", function() {
        var items = toolbar.items;
        items.push(expectedItem);
        items.push({id: 1, a: "abc"});
        expect(toolbar.getItemByID(4)).toBe(expectedItem);
        expect(toolbar.getItemByID(5)).toBeUndefined();
    });

    it("should return active item from group", function() {
        var groups = toolbar.groups;
        groups[1] = [];
        groups[1].push(expectedItem);
        groups[1].push({id: 1, active: false });

        expect(toolbar.getActiveItemFromGroup(1)).toBe(expectedItem);
    });

    it("should fill all toolbar arrays", function() {
        toolbar.init([
            {
                type: "buttonGroup",
                buttons: [
                    expectedItem,
                    otherItem
                ]
            }
        ]);

        expect(toolbar.items.length).toEqual(2);
        expect(toolbar.groups.length).toEqual(2);
        expect(toolbar.groups[0]).toBeUndefined();
        expect(toolbar.getStructure().length).toEqual(1);
        expect(toolbar.getStructure()[0].buttons.length).toEqual(2);

    })

});