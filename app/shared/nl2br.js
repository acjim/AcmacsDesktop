module.exports = function() {
    return function(text) {
        return text ? text.replace(/\n/g, '<br/>') : '';
    };
}
