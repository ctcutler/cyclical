Cyclical Calendar
=================
Cyclical Calendar is a calendar for things you want to do periodically but not on specific dates.  Things like getting your hair cut or watering the plants.  

To try it out, [download the project](https://github.com/ctcutler/cyclical/archive/master.zip) and load cyclical.html in Google Chrome (other web browsers are untested but may also work).  

INSTRUCTIONS

To get started, drag the green dot upwards to create a circle that represents a reminder.  Make the circle larger if you want to be reminded less frequently and smaller if you want to be reminded more frequently.  

When you let go the cycle will be created and you will be prompted to enter a name for it.  You can click on the label to change the name or remove the cycle.  And you can drag the green dot on the circle to adjust how much time is left. 

Drag the center dot up to create additional cycles.  

As time passes the green dot on each cycle will travel around the circle.  When it gets back to the top of the circle, the cycle is "due" and turns red.  It is time to get your hair cut, water the plants, or call your Mom.  When you've performed the task, click on the dot to reset the cycle and it will begin travelling around the circle again.  

ABOUT

Cyclical Calendar was written in javascript using D3.js to manipulate SVG and HTML elements.  It uses HTML5 local storage to persist state and is entirely client-side.  

FUTURE IMPROVEMENTS

* Come up with a better strategy for displaying the labels of two cycles of the same size (right now they just show up on top of one another).  
* Better look and feel. 
* Expand to fit the browser window.
