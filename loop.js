var Timer = 0;
var Log = "";
var Program = [];
var ElementPath = [];

var This = null;

var MouseX = 0;
var MouseY = 0;

var SelectorRegExp = new RegExp("(\r\n|\r|\n)", "g" );
var TagRegExp = new RegExp("[.#]", "g" );

var StartTime = 0;
var DeltaTime = 0;

function Msg( Message )
{
    Log += Message + "<br>";
    document.getElementById("output").innerHTML = Log;
}

function AreItemMatching( ItemSelector, ItemPath )
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

function AreMatching( Selector, Path )
{
    if( AreItemMatching( Selector[Selector.length-1], Path[Path.length-1] ) )
    {
        var PathIndex = Path.length - 2;
        for( var I = Selector.length - 2 ; I >= 0 ; I-- )
        {
            while( PathIndex >= 0 && AreItemMatching( Selector[I], Path[PathIndex] ) == false )
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

function GetFunction()
{
    for( var P = 0 ; P < Program.length ; P++ )
    {
        if( AreMatching( Program[P].Selector, ElementPath ) )
        {
            return Program[P].Function;
        }
    }
}

function RunElement( Element )
{
    var Child = Element.firstChild;
    while( Child )
    {
        if( Child.nodeType == Node.ELEMENT_NODE )
        {
            ElementPath.push( {Tag:Child.nodeName.toLowerCase(), Class:Child.className, Id:Child.id} );

            var Func = GetFunction();
            if( Func instanceof Function )
            {
                This = Child;
                Func();
                This = null;
            }

            RunElement( Child);
            
            ElementPath.pop();
        }
        
        Child = Child.nextSibling; 
    }
}

function Run()
{
    var Time = (new Date).getTime();
    DeltaTime = Time - StartTime;
    StartTime = Time;

    RunElement( document );
}

function Play()
{
    StartTime = (new Date).getTime();

    if( Timer == 0 )
    {
        Timer = setInterval( Run, 1 );
    }
}

function Stop()
{
    clearTimeout( Timer );
    Timer = 0;
}

function AddFunction( Selector, Function )
{
    var Entry = {};
    Entry.Selector = [];
    eval( "Entry.Function = function(){" + Function + "}" );
 
    var Items = Selector.split(" ");
    for( var I = 0 ; I < Items.length ; I++ )
    {
        var Item = {};

        Item.Tag = Items[I].split(TagRegExp)[0];
        Item.Class = Items[I].split(".")[1];
        Item.Id = Items[I].split("#")[1];
        
        Entry.Selector.push( Item );
    }

    Program.push( Entry );
}

function ParseString( String )
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
                 var Selector = String.substring( SelectorIndex, FunctionIndex ).replace( SelectorRegExp, "" );
                 var Function = String.substring( FunctionIndex + 1, I );
                 AddFunction( Selector, Function );
    
                 SelectorIndex = I + 1;
            }
        }
    }
}

function ParseFile( File )
{
    XMLHttp = new XMLHttpRequest();
    XMLHttp.open("GET", File, false);
    XMLHttp.send();
    ParseString( XMLHttp.responseText );
}

function ParseLinks()
{
    var Links = document.getElementsByTagName("link");
    for( var I = 0 ; I < Links.length ; I++ )
    {
        if( Links[I].rel == "loop" )
        {
            ParseFile( Links[I].href );
        }
    }
}

function OnMouseMove( Event )
{
    MouseX = Event.x + document.body.scrollLeft;
    MouseY = Event.y + document.body.scrollTop;
}

function GetOffsetLeft( Element )
{
    return Element && Element.offsetLeft ? GetOffsetLeft( Element.offsetParent ) + Element.offsetLeft : 0;
}

function GetOffsetTop( Element )
{
    return Element && Element.offsetTop ? GetOffsetTop( Element.offsetParent ) + Element.offsetTop : 0;
}

function IsMouseInside( Element )
{
    var OffsetLeft = GetOffsetLeft( Element );
    var OffsetTop = GetOffsetTop( Element );

    return  MouseX > OffsetLeft && MouseX < OffsetLeft + Element.clientWidth
        &&  MouseY > OffsetTop && MouseY < OffsetTop + Element.clientHeight;
}

function Interpolate( A, B, Time )
{
    return A * ( 1 - Time ) + B * Time;
}

function InterpolateEx( A, B, TMin, TMax, Time )
{
    return Interpolate( A, B , ( Time - TMin ) / ( TMax - TMin ) );
}

document.onmousemove = OnMouseMove;

ParseLinks();
Play();