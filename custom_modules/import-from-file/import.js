/**
 * Helpers.
 */
var fs = require('fs');

exports.textData = function() {
    try {
        var data = fs.readFileSync('./data.txt', 'utf8');
        console.log('trung nguyen');
        console.log(data.toString());
        return data;
    } catch(e) {
        console.log('Error:', e.stack);
    }

    // options = options || {};
    // var type = typeof val;
    // if (type === 'string' && val.length > 0) {
    //     return parse(val);
    // } else if (type === 'number' && isFinite(val)) {
    //     return options.long ? fmtLong(val) : fmtShort(val);
    // }
    // throw new Error(
    //     'val is not a non-empty string or a valid number. val=' +
    //     JSON.stringify(val)
    // );
};