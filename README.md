# mybugjs
A funny bug that crawls over the DOM layers;

NOTE: This is more of a joke than a finished project, so you should not take it seriously.

Just clone this repo, then load the bug.html in your browser to try!
It will load JS, css, and initialize the object;
The screen will show a beetle that will crawl some distance and disappear.
Move your mouse and it will reappear, crawling across the screen in random direction.

In this mode, the script analyzes your mouse movements, and programs the appearance, 
stop, and further movement of the beetle in accordance with these movements.

Read the comments inside the script for a better understanding of how it works.

I apologize for my "not very good" English:)


Object initialization example:

    // Make your bug attached to BODY DOM container
    var bug = myBug($("body"));

    // Start queue actions checking:
    bug.start();

    // Or make it all with setting console debug at level==1:
    var bug = myBug($("body"), {debug: 1}).start();

    // IMPORTANT: Bug is hidden! You can show/hide it by:
    var offset = null; // show in random offset
    offset = {left: 135, top: 250}; // show in 135x250 screen coordinates
    bug.show(offset, 5000); // fadeIn in 5 seconds
    bug.hide(1000); // fadeOut in 1 second

    bug.show(); // Show in the random offset immidiatly

    // Add new action into go_queue:
    // bug.runto(direction, distance, speed, sleep_before, callback);
    // Run in 270 degrees direction on 100px distance, 20/1000 sec time betwin steps, but sleep 1sec before:
    bug.runto(270, 100, 20, 1000);

    bug.hide(); // Hide without any faders

    // Start/Stop bug randomize running on mouse events:
    // NOTE: bug will be showed and hided automaticly on mouse moving!
    bug.start_random_mouse_running();
    bug.stop_random_mouse_running();

    // Setup callbacks and other attributes: 
    // note: "this" variable in callbacks - object of current bug instance
    // you can get/set it attributes, e.g. this.offset, this.direction, this.speed, etc...
    // also, you can use it methods, eg: this.show() ot this.hide()
    var bug = myBug($("body"), {

        // Called on each queue action processing started:
        on_action: function(distance, direction, speed) {
            console.info("RUNNING DIST: "+distance+"; DEG: "+direction+"; SPEED: "+speed+"; OFFSET: " + this.offset.left + "x" + this.offset.top)
        },

        // Called on every step making:
        on_step: function(direction, offset) {
            // do something...
        },

        on_show: function() {
            console.info("SHOW, BUG is visible: " + this.is_visible);
        },
        on_hide: function() {
            console.info("HIDE, BUG is visible: " + this.is_visible);
        },

        // Check queue every 20/1000 sec:
        queue_interval: 20, 

        // Default time between steps: 30/1000 sec:
        speed: 30, 

        // Default step distance is 3*cos(rad) or 3*sin(rad) (IT'S NOT A PIXELS!)
        step_size: 3,

        // Maximum randomized direction difference in degrees
        rand_direction_diff: 80,

        // Changing direction probability: (Math.random() > rand_direction_chance)
        rand_direction_chance: 4/5,

        // Show bug only if queue length >= min_queue
        min_queue: 5, 

        // Fade effects on show()/hide() in 1/1000 seconds:
        fadein: 5000, // 5sec
        fadeout: 1000, // 1sec

        debug: 1
    }).start().start_random_mouse_running(5000, 1000);




JS minimization:
    I use yui-compressor to make min.js minimizated script;
    This is indicated in the file: Makefile;

    Just run "make" in the working folder to compile new min.js file
    
