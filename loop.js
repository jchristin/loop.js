////////////////////////////////
//
// loop.js v1.0.0
// http://julbaxter.github.com/loop.js/
//
// Copyright (c) 2011, Julien Christin, Frederic Brachfogel
// Licensed under the Apache 2.0 License.
//
////////////////////////////////

var loop = {};

loop.Program = [];
loop.ElementPath = [];

loop.MouseX = 0;
loop.MouseY = 0;

loop.SelectorRegExp = new RegExp("(\r\n|\r|\n)", "g" );
loop.TagRegExp = new RegExp("[.#]", "g" );

loop.DeltaTime = 0;

////////////////////////////////

loop.Log = function( Message )
{
    if( typeof console == "object" )
    {
        console.log( "loop: " + Message );
    }
}

loop.Clock =
{
    StartTime: 0,

    Start: function()
    {
        StartTime = (new Date).getTime();
    },

    GetElapsedTime: function( Restart )
    {
        var CurrentTime = (new Date).getTime();
        var ElapsedTime = CurrentTime - StartTime;

        if( Restart )
        {
            StartTime = CurrentTime;
        }

        return ElapsedTime;
    }
}

loop.Timer =
{
    MinTime: 1,
    Callback: null,
    Timer: null,

    Start: function()
    {
        loop.Clock.Start();

        if( this.Timer == null )
        {
            this.Timer = setInterval( this.Callback, this.MinTime );
        }
    },

    Stop: function()
    {
        clearTimeout( this.Timer );
        this.Timer = null;
    }
}

loop.AreItemMatching = function( ItemSelector, ItemPath )
{
    if( ItemSelector.Tag != "" )
    {
        if( ItemPath.Tag != ItemSelector.Tag )
        {
            return false;
        }
    }
    
    if( ItemSelector.Class )
    {
        if( ItemPath.Class != ItemSelector.Class )
        {
            return false;
        }
    }
    
    if( ItemSelector.Id )
    {
        if( ItemPath.Id != ItemSelector.Id )
        {
            return false;
        }
    }

    return true;
}

loop.AreMatching = function( Selector, Path )
{
    if( this.AreItemMatching( Selector[Selector.length-1], Path[Path.length-1] ) )
    {
        var PathIndex = Path.length - 2;
        for( var I = Selector.length - 2 ; I >= 0 ; I-- )
        {
            while( PathIndex >= 0 && this.AreItemMatching( Selector[I], Path[PathIndex] ) == false )
            {
                PathIndex--;
            }

            if( PathIndex < 0 )
            {
                return false;
            }

            PathIndex--;
        }

        return true;
    }

    return false;
}

loop.GetFunction = function()
{
    for( var P = 0 ; P < this.Program.length ; P++ )
    {
        if( this.AreMatching( this.Program[P].Selector, this.ElementPath ) )
        {
            return this.Program[P].Function;
        }
    }
}

loop.ExecuteElement = function( Element )
{
    var Child = Element.firstChild;
    while( Child )
    {
        if( Child.nodeType == Node.ELEMENT_NODE )
        {
            this.ElementPath.push( {Tag:Child.nodeName.toLowerCase(), Class:Child.className, Id:Child.id} );

            var Func = this.GetFunction();
            if( Func instanceof Function )
            {
                Func( Child);
            }

            this.ExecuteElement( Child );
            
            this.ElementPath.pop();
        }
        
        Child = Child.nextSibling; 
    }
}

loop.Iterate = function()
{
    loop.DeltaTime = loop.Clock.GetElapsedTime( true );
    loop.ExecuteElement( document );
}

loop.AddFunction = function( Selector, Function )
{
    var Entry = {};
    Entry.Selector = [];
    eval( "Entry.Function = function( This ){" + Function + "}" );
 
    var Items = Selector.split(" ");
    for( var I = 0 ; I < Items.length ; I++ )
    {
        var Item = {};

        Item.Tag = Items[I].split(this.TagRegExp)[0];
        Item.Class = Items[I].split(".")[1];
        Item.Id = Items[I].split("#")[1];
        
        Entry.Selector.push( Item );
    }

    this.Program.push( Entry );
}

loop.ParseString = function( String )
{
    var Blocks = {};

    var SelectorIndex = 0;
    var FunctionIndex = 0;

    var BraceCount = 0;

    for( var I = 0 ; I < String.length ; I++ )
    {
        var Char = String[I];

        if( Char == '{' )
        {
            BraceCount++;
            if( BraceCount == 1 )
            {
                FunctionIndex = I;
            }
        }
        else
        if( Char == '}' )
        {
            BraceCount--;
            if( BraceCount == 0 )
            {
                 var Selector = String.substring( SelectorIndex, FunctionIndex ).replace( this.SelectorRegExp, "" );
                 var Function = String.substring( FunctionIndex + 1, I );
                 this.AddFunction( Selector, Function );
    
                 SelectorIndex = I + 1;
            }
        }
    }
}

loop.ParseFile = function( File )
{
    XMLHttp = new XMLHttpRequest();
    XMLHttp.open("GET", File, false);
    XMLHttp.send();
    this.ParseString( XMLHttp.responseText );
}

loop.ParseLinks = function()
{
    var Links = document.getElementsByTagName("link");
    for( var I = 0 ; I < Links.length ; I++ )
    {
        if( Links[I].rel == "loop" )
        {
            this.ParseFile( Links[I].href );
        }
    }
}

loop.Init = function()
{
    var StartTime = (new Date).getTime();

    this.ParseLinks();

    var ElapsedTime = (new Date).getTime() - StartTime;
    this.Log( "file(s) parsed and evaluated in " + ElapsedTime + "ms." );

    this.Timer.Callback = this.Iterate;
    this.Timer.Start();
}

loop.GetOffsetLeft = function( Element )
{
    return Element && Element.offsetLeft ? this.GetOffsetLeft( Element.offsetParent ) + Element.offsetLeft : 0;
}

loop.GetOffsetTop = function( Element )
{
    return Element && Element.offsetTop ? this.GetOffsetTop( Element.offsetParent ) + Element.offsetTop : 0;
}

loop.IsMouseInside = function( Element )
{
    var OffsetLeft = this.GetOffsetLeft( Element );
    var OffsetTop = this.GetOffsetTop( Element );
    
    return  this.MouseX > OffsetLeft && this.MouseX < OffsetLeft + Element.clientWidth
        &&  this.MouseY > OffsetTop && this.MouseY < OffsetTop + Element.clientHeight;
}

loop.Interpolate = function( A, B, Time )
{
    return A * ( 1 - Time ) + B * Time;
}

loop.InterpolateEx = function( A, B, TMin, TMax, Time )
{
    return this.Interpolate( A, B , ( Time - TMin ) / ( TMax - TMin ) );
}

function f_clientWidth() {
	return f_filterResults (
		window.innerWidth ? window.innerWidth : 0,
		document.documentElement ? document.documentElement.clientWidth : 0,
		document.body ? document.body.clientWidth : 0
	);
}
function f_clientHeight() {
	return f_filterResults (
		window.innerHeight ? window.innerHeight : 0,
		document.documentElement ? document.documentElement.clientHeight : 0,
		document.body ? document.body.clientHeight : 0
	);
}
function f_scrollLeft() {
	return f_filterResults (
		window.pageXOffset ? window.pageXOffset : 0,
		document.documentElement ? document.documentElement.scrollLeft : 0,
		document.body ? document.body.scrollLeft : 0
	);
}
function f_scrollTop() {
	return f_filterResults (
		window.pageYOffset ? window.pageYOffset : 0,
		document.documentElement ? document.documentElement.scrollTop : 0,
		document.body ? document.body.scrollTop : 0
	);
}
function f_filterResults(n_win, n_docel, n_body) {
	var n_result = n_win ? n_win : 0;
	if (n_docel && (!n_result || (n_result > n_docel)))
		n_result = n_docel;
	return n_body && (!n_result || (n_result > n_body)) ? n_body : n_result;
}


document.onmousemove = function( Event )
{
    loop.MouseX = Event.clientX + f_scrollLeft();
    loop.MouseY = Event.clientY + f_scrollTop();
}

////////////////////////////////

loop.Init();

////////////////////////////////