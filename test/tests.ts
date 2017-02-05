import * as Cookies from '../src/es-cookie';
import * as assert from 'assert';

let cleanup = function () {
    // Remove the cookies created using es-cookie default attributes
    Object.keys(Cookies.getAll()).forEach(Cookies.remove);

    // Remove the cookies created using browser default attributes
    Object.keys(Cookies.getAll()).forEach(function (cookie) {
        Cookies.remove(cookie, { path: '' });
    });
};

describe('read', function () {
    afterEach(cleanup);

    it('should work with simple values', function () {
        document.cookie = 'c=v';
	    assert.strictEqual(Cookies.get('c'), 'v');
    });

    it('should support empty values', function () {
        Cookies.set('c', '');
        assert.strictEqual(Cookies.get('c'), '', 'should return value');
    });

    it('should return undefined for non-existant cookies', function () {
        assert.strictEqual(Cookies.get('whatever'), undefined, 'return undefined');
    });

    it('should support equals sign in cookie value', function () {
        Cookies.set('c', 'foo=bar');
	    assert.strictEqual(Cookies.get('c'), 'foo=bar', 'should include the entire value');
    });

    it('should support percent character in cookie value', function () {
        Cookies.set('bad', 'foo%');
	    assert.strictEqual(Cookies.get('bad'), 'foo%', 'should read the percent character');
    });

    it('should work with percent character in cookie value mixed with encoded values', function () {
        document.cookie = 'bad=foo%bar%22baz%bax%3D';
	    assert.strictEqual(Cookies.get('bad'), 'foo%bar"baz%bax=');
    });

    it('should read all when cookies exist', function () {
        Cookies.set('c', 'v');
        Cookies.set('foo', 'bar');
        assert.deepEqual(Cookies.getAll(), { c: 'v', foo: 'bar' }, 'returns object containing all cookies');
    });

    it('should read all when there are no cookies', function () {
        assert.deepEqual(Cookies.getAll(), {}, 'returns empty object');
    });

    it('should support RFC 6265 - reading cookie-octet enclosed in DQUOTE', function () {
        document.cookie = 'c="v"';
        assert.strictEqual(Cookies.get('c'), 'v', 'should simply ignore quoted strings');
    });

    it('should work with null', function () {
        Cookies.set('c', null);
	    assert.strictEqual(Cookies.get('c'), 'null', 'should write value');
    });

    it('should work with undefined', function () {
        Cookies.set('c', undefined);
	    assert.strictEqual(Cookies.get('c'), 'undefined', 'should write value');
    });

    it('should work when there is another unrelated cookie with malformed encoding in the name', function () {
        document.cookie = 'BS%BS=1';
        document.cookie = 'c=v';
        assert.strictEqual(Cookies.get('c'), 'v', 'should not throw a URI malformed exception when retrieving a single cookie');
        assert.deepEqual(Cookies.getAll(), { c: 'v' }, 'should not throw a URI malformed exception when retrieving all cookies');
        document.cookie = 'BS%BS=1; expires=Thu, 01 Jan 1970 00:00:00 GMT'; // remove malformed cookie
    });

    it('should work when there is another unrelated cookie with malformed encoding in the value', function () {
        document.cookie = 'invalid=%A1';
        document.cookie = 'c=v';
        assert.strictEqual(Cookies.get('c'), 'v', 'should not throw a URI malformed exception when retrieving a single cookie');
        assert.deepEqual(Cookies.getAll(), { c: 'v' }, 'should not throw a URI malformed exception when retrieving all cookies');
        Cookies.remove('invalid', {path: ''});
    });
});

describe('write', function () {
    afterEach(cleanup);

    it('should write string primitive', function () {
        Cookies.set('c', 'v');
        assert.strictEqual(Cookies.get('c'), 'v', 'should write value');
    });

    it('should write value "[object Object]"', function () {
        Cookies.set('c', '[object Object]');
	    assert.strictEqual(Cookies.get('c'), '[object Object]', 'should write value');
    });

    it('should work with expires as days from now', function () {
        let twentyOneDaysFromNow = new Date();
        twentyOneDaysFromNow.setDate(twentyOneDaysFromNow.getDate() + 21);
        let actual = Cookies.createCookieString('c', 'v', { expires: 21 });
        assert.strictEqual(actual, 'c=v; Expires=' + twentyOneDaysFromNow.toUTCString() + '; Path=/');
    });

    it('should work with expires as fraction of a day', function () {
        let getAttributeValue = function (createdCookie: string, attributeName: string) {
            let pairs = createdCookie.split('; ');

            for (let i = 0; i < pairs.length; i++) {
                let split = pairs[i].split('=');

                if (split[0] === attributeName) {
                    return split[1];
                }
            }
        };

        let expires = new Date(getAttributeValue(Cookies.createCookieString('c', 'v', { expires: 0.5 }), 'Expires'));
        let now = new Date();
        let message = '"' + expires.getTime() + '" should be greater than "' + now.getTime() + '"';
        assert.strictEqual(expires.getTime() > now.getTime() + 1000, true, message);
    });

    it('should support expires option as Date instance', function () {
        let sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        let actual = Cookies.createCookieString('c', 'v', { expires: sevenDaysFromNow });
        assert.strictEqual(actual, 'c=v; Expires=' + sevenDaysFromNow.toUTCString() + '; Path=/');
    });

    it('should support true secure option', function () {
	    let expected = 'c=v; Path=/; Secure';
	    let actual = Cookies.createCookieString('c', 'v', {secure: true});
	    assert.strictEqual(actual, expected, 'should add secure attribute');
    });

    it('should support false secure option', function () {
        let actual = Cookies.createCookieString('c', 'v', {secure: false});
        assert.strictEqual(actual, 'c=v; Path=/', 'false should not modify path in cookie string');
    });

    it('should not set undefined attribute values', function () {
        assert.strictEqual(Cookies.createCookieString('c', 'v', {
		    expires: undefined
        }), 'c=v; Path=/', 'should not write undefined expires attribute');

        assert.strictEqual(Cookies.createCookieString('c', 'v', {
            path: undefined
        }), 'c=v', 'should not write undefined path attribute');

        assert.strictEqual(Cookies.createCookieString('c', 'v', {
            domain: undefined
        }), 'c=v; Path=/', 'should not write undefined domain attribute');

        assert.strictEqual(Cookies.createCookieString('c', 'v', {
            secure: undefined
        }), 'c=v; Path=/', 'should not write undefined secure attribute');
    });
});

describe('remove', function () {
    afterEach(cleanup);

    it('should delete a cookie', function () {
        Cookies.set('c', 'v');
        Cookies.remove('c');
        assert.strictEqual(document.cookie, '', 'should delete the cookie');
    });

    it('should delete a cookie with attributes', function () {
        let attributes = { path: '/' };
        Cookies.set('c', 'v', attributes);
        Cookies.remove('c', attributes);
        assert.strictEqual(document.cookie, '', 'should delete the cookie');
    });

    it('should not alter attributes object', function () {
        let attributes = {path: '/'};
        Cookies.set('c', 'v', attributes);
        Cookies.remove('c', attributes);
        assert.deepEqual(attributes, {path: '/'}, "won't alter attributes object");
    });
});

describe('encode values', function () {
    afterEach(cleanup);

    let specialValues = [
        {val: '"', plain: '%22', name: 'double quote'},
        {val: '"v', plain: '%22v', name: 'value starting wtih a double quote'},
        {val: 'v"', plain: 'v%22', name: 'value ending wtih a double quote'},
        {val: ' ', plain: '%20', name: 'space'},
        {val: ',', plain: '%2C', name: 'comma'},
        {val: ';', plain: '%3B', name: 'semicolon'},
        {val: ';;', plain: '%3B%3B', name: 'multiple semicolons'},
        {val: '\\', plain: '%5C', name: 'backslash'},
        {val: '#', plain: '#', name: 'sharp'},
        {val: '$', plain: '$', name: 'dollar sign'},
        {val: '%', plain: '%25', name: 'percent character'},
        {val: '&', plain: '&', name: 'ampersand'},
        {val: '+', plain: '+', name: 'plus sign'},
        {val: ':', plain: ':', name: 'colon character'},
        {val: '<', plain: '<', name: 'less-than character'},
        {val: '>', plain: '>', name: 'greater-than character'},
        {val: '=', plain: '=', name: 'equals sign'},
        {val: '/', plain: '/', name: 'slash'},
        {val: '?', plain: '?', name: 'question mark'},
        {val: '@', plain: '@', name: 'at character'},
        {val: '[', plain: '[', name: 'opening square bracket'},
        {val: ']', plain: ']', name: 'closing square bracket'},
        {val: '^', plain: '^', name: 'caret'},
        {val: '`', plain: '`', name: 'grave accent'},
        {val: '{', plain: '{', name: 'opening curly bracket'},
        {val: '}', plain: '}', name: 'closing curly bracket'},
        {val: '|', plain: '|', name: 'pipe character'},
        {val: '{{', plain: '{{', name: 'multiple curly brackets'},
        {val: 'ã', plain: '%C3%A3', name: 'two-byte character'},
        {val: '₯', plain: '%E2%82%AF', name: 'three-byte character'},
        {val: '𩸽', plain: '%F0%A9%B8%BD', name: 'four-byte character'},
    ];

    specialValues.forEach(namedVal => {
        it('should support ' + namedVal.name, function () {
            Cookies.set('c', namedVal.val);
            assert.strictEqual(Cookies.get('c'), namedVal.val);
            assert.strictEqual(document.cookie, 'c=' + namedVal.plain);
        });
    });
});

describe('encode names', function () {
    afterEach(cleanup);

    let specialKeys = [
        {key: '(', plain: '%28', name: 'opening parens character'},
        {key: ')', plain: '%29', name: 'closing parens character'},
        {key: '(())', plain: '%28%28%29%29', name: 'replacing parens globally'},
        {key: '<', plain: '%3C', name: 'less-than character'},
        {key: '>', plain: '%3E', name: 'greater-than character'},
        {key: '@', plain: '%40', name: 'at character'},
        {key: ',', plain: '%2C', name: 'comma'},
        {key: ';', plain: '%3B', name: 'semicolon'},
        {key: ':', plain: '%3A', name: 'colon character'},
        {key: '\\', plain: '%5C', name: 'backslash character'},
        {key: '"', plain: '%22', name: 'double quote character'},
        {key: '/', plain: '%2F', name: 'slash character'},
        {key: '[', plain: '%5B', name: 'opening square bracket'},
        {key: ']', plain: '%5D', name: 'closing square bracket'},
        {key: '?', plain: '%3F', name: 'question mark'},
        {key: '=', plain: '%3D', name: 'equals sign'},
        {key: '{', plain: '%7B', name: 'opening curly brackets'},
        {key: '}', plain: '%7D', name: 'closing curly brackets'},
        {key: '	', plain: '%09', name: 'horizontal tab character'},
        {key: ' ', plain: '%20', name: 'space character'},
        {key: '#', plain: '#', name: 'sharp character'},
        {key: '$', plain: '$', name: 'dollar sign'},
        {key: '%', plain: '%25', name: 'percent character'},
        {key: '&', plain: '&', name: 'ampersand character'},
        {key: '+', plain: '+', name: 'plus sign'},
        {key: '^', plain: '^', name: 'caret character'},
        {key: '`', plain: '`', name: 'grave accent character'},
        {key: '|', plain: '|', name: 'pipe character'},
        {key: '||', plain: '||', name: 'multiple pipes'},
        {key: 'ã', plain: '%C3%A3', name: 'two-byte characters'},
        {key: '₯', plain: '%E2%82%AF', name: 'three-byte characters'},
        {key: '𩸽', plain: '%F0%A9%B8%BD', name: 'four-byte characters'},
    ];

    specialKeys.forEach(namedVal => {
        it('should support ' + namedVal.name, function () {
            Cookies.set(namedVal.key, 'v');
            assert.strictEqual(Cookies.get(namedVal.key), 'v');
            assert.strictEqual(document.cookie, namedVal.plain + '=v');
        });
    });
});