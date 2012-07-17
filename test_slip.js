#!/usr/bin/env node
var slip = require( './node-slip' );
var assert = require( 'assert' );

var parser_fixtures = [
    [ 'null input', [], [], [], [] ],
    [ 'one packet per event', ['C000112233445566C0'], ['00112233445566'], [], [] ],
    [ 'two packets, one event', ['C0012345C0C06789ABC0'], ['012345','6789AB'], [], [] ],
    [ 'one packet, two events', ['C0FFEEDD', 'CCBBAAC0'], [ 'FFEEDDCCBBAA' ], [], [] ],
    [ 'one packet, three events', ['C0FFEEDD', 'CCBBAA', 'D199C0'], [ 'FFEEDDCCBBAAD199' ], [], [] ],
    [ 'one packet, escape end', [ 'C000DBDCFFC0' ], [ '00C0FF' ], [], [] ],
    [ 'one packet, escape esc', [ 'C0AADBDD55C0' ], [ 'AADB55' ], [], [] ],
    [ 'two packets, escape end', [ 'C0001122DB', 'DC3344C0' ], [ '001122C03344' ], [], [] ],
    [ 'two packets, escape esc', [ 'C0FFEEDB', 'DDDDCCBBAAC0' ], [ 'FFEEDBDDCCBBAA' ], [], [] ],
    [ 'one packet, frame error', [ 'C0AABBCCC00102C0DDEEC0' ], [ 'AABBCC', 'DDEE' ], [ '0102' ], [] ],
    [ 'one packet, esc error', [ 'C000DBAA11C0' ], [ '0011' ], [], [ 'AA' ] ],
    [ 'one packet, two esc errors', [ 'C000DBAADBBB11C0' ], [ '0011' ], [], [ 'AA', 'BB' ] ],
    [ 'one big long packet', ['C000112233445566778899AABBCCDDEEFF001122334455667788C0'], ['00112233445566778899AABBCCDDEEFF001122334455667788'], [], [] ],
    [ 'two events, shortish packet', ['C0112233445566778899AABBCCDDEEFF', '1122334455667788C0'], ['112233445566778899AABBCCDDEEFF1122334455667788'], [], [] ],
    [ 'two events, long packet', ['C000112233445566778899AABBCCDDEEFF', '001122334455667788C0'], ['00112233445566778899AABBCCDDEEFF001122334455667788'], [], [] ]
];

var generator_fixtures = [
    [ '00FF00FFDBFFC0FF', 'C000FF00FFDBDDFFDBDCFFC0'],
    [ '001122', 'C0001122C0' ]
];

function test_receiver( fixture ) {
    this.fixture = fixture;    
    this.framing_buffers = [];
    this.data_buffers = [];
    this.escape_buffers = [];
}

test_receiver.prototype.check = function () {
    for( var i = 0, il = this.fixture[2].length; i < il; i++ ) {
	assert.equal( this.fixture[2][i], this.data_buffers[i].toString( 'hex' ).toUpperCase() );
    }

    for( var i = 0, il = this.fixture[3].length; i < il; i++ ) {
	assert.equal( this.fixture[3][i], this.framing_buffers[i].toString( 'hex' ).toUpperCase() );
    }

    for( var i = 0, il = this.fixture[4].length; i < il; i++ ) {
	assert.equal( this.fixture[4][i], this.escape_buffers[i].toString(16).toUpperCase() );
    }

};

test_receiver.prototype.framing = function ( data ) {
    this.framing_buffers.push( data );
};

test_receiver.prototype.data = function ( data ) {
    this.data_buffers.push( data );
};

test_receiver.prototype.escape = function ( character ) {
    this.escape_buffers.push( character );
};

for( var i = 0, il = parser_fixtures.length; i < il; i++ ) {
    console.log( '*** current test: ' + parser_fixtures[i][0] );
    var test_filter = new test_receiver( parser_fixtures[i] );
    var test_object = new slip.parser( test_filter );

    for( var j = 0, jl = parser_fixtures[i][1].length; j < jl; j++ ) {
	test_object.write( new Buffer( parser_fixtures[i][1][j], 'hex' ) );
    }

    test_filter.check();
}

for( var i = 0, il = generator_fixtures.length; i < il; i++ ) {
    console.log( 'Testing Generator Fixture ' + i );
    assert.equal( generator_fixtures[i][1], slip.generator( new Buffer( generator_fixtures[i][0], 'hex' ) ).toString('hex').toUpperCase() );
}
