/*

BSD 2-Clause License

Copyright (c) 2020, procool
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

                                          )
                                         (               ~
                             _ ___________ )            ~
    SIMPLE README:          [_[___________#          c(_) *coffe
    ==============

    This script shows some funny animated bug over your screen

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

    
*/


var myBug = function($main_wrapper, opts) {
    if (!opts) opts = {};

    if (!opts["queue_interval"]) opts["queue_interval"] = 10; // How fast we should check queue, 1/1000 sec
    if (!opts["speed"]) opts["speed"] = 30;         // Time between steps, 1/1000 sec
    if (!opts["step_size"]) opts["step_size"] = 3;  // Not a pixels!! Just coefficient!
    if (!opts["rand_direction_diff"]) opts["rand_direction_diff"] = 80;  // Max randomized direction difference in degrees
    if (!opts["rand_direction_chance"]) opts["rand_direction_chance"] = 4/5;
    if (!opts["min_queue"] && opts["min_queue"] != 0) opts["min_queue"] = 5; // Show bug only if queue length >= min_queue
    if (!opts["debug"]) opts["debug"] = 0;          // debug levels 1-10, 0 - disabled

    var baseClass = function() {
        // Image wrapper:
        this.$wrap = $("<div class=\""+this.class_prefix+"wrapper\"></div>");
        this.$wrap.hide();
        this.is_visible = false;
        this.step_size = opts["step_size"];
        this.speed = opts["speed"];
        this.fadein = opts["fadein"];
        this.fadeout = opts["fadeout"];
        this.min_queue = opts["min_queue"];
        this.rnd_dir_diff = parseInt(opts["rand_direction_diff"]/2)*2;
        this.rand_direction_chance = opts["rand_direction_chance"];

        // Image tag, image as background
        this.$img = $("<div class=\""+this.class_prefix+"img\"></div>");
        this.initialized = false;
    }
    var proto = baseClass.prototype;

    proto.cname = "mybug";
    proto.class_prefix = "mybug-";

    // Image coordinates: (Hardcode, $img background-size: 110%; $wrap height: 10px
    var img_css_positions = [0, -14, -25, -36, -47, -60, -72, -85, -97];

    // Actions Array length: (BUG running by this preprogrammed actions)
    var go_queue_max_history = 20;


    function degreesToRadians(grad) {
        return (grad * Math.PI) / 180;
    }

    function check_degree(degr) {
        if (degr > 360) degr = degr - 360;
        if (degr < 0) degr = 360 + degr;
        return degr;
    }

    proto.init = function() {
        if (this.initialized) return;
        this.$wrap.append(this.$img);
        $main_wrapper.append(this.$wrap);

        // Count maximum width and height:
        this.max_h = $main_wrapper.outerHeight(true)-100;
        this.max_w = $main_wrapper.outerWidth(true)-100;

        // Cache mouse movements here:
        this._mouse_history = [];

        // List of next bug movements based on the this._mouse_history:
        this._go_queue = [];

        // Found and store first random place on the screen:
        this.make_random_offset();

        // Store first random direction:
        this.direction = parseInt(Math.random() * 360);
        this.initialized = true;
    }



    // Set next sprite of bug by count number:
    proto._draw_img_count = function(count) {
        this.$img.css("background-position", "0px " + img_css_positions[count] + "px");
    }

    // Draw next sprite and increase counter:
    proto._draw_img_next = function() {
        if (!this._img_count || this._img_count>=9) this._img_count = 0;
        this._draw_img_count(this._img_count);
        this._img_count += 1;
        if (opts.on_step) opts.on_step.call(this, this.direction, this.offset);
    }

    // Draw sprite - set width, height and offset:
    proto.draw = function(offset) {
        this.init();
        if (!offset) offset = this.offset;
        if (offset != this.offset) this.offset = offset;
        this.$wrap.offset(offset);
        this._draw_img_next();
    }


    // Show or hide bug:
    proto.show = function(offset, timeout) {
        this.is_visible = true;
        this.draw(offset);
        if (timeout) {
            this.$wrap.fadeIn(timeout);
        } else {
            this.$wrap.show();
        }
        if (opts.on_show) opts.on_show.call(this);
    }
    proto.hide = function(timeout) {
        this.is_visible = false;
        if (timeout) {
            this.$wrap.fadeOut(timeout);
        } else {
            this.$wrap.hide();
        }
        if (opts.on_hide) opts.on_hide.call(this);
    }


    // Generate and store random offset of the next sprite position:
    proto.make_random_offset = function() {
        this.offset = {left: parseInt((this.max_w - 20) * Math.random())+20, top: parseInt((this.max_h-20) * Math.random())+20};
    }
            

    // "Run forest, run!!!" :))  direction - value in degrees (0-360)
    proto.run = function(direction) {
        // If no direction given, get stored value:
        if (!direction && direction != 0) direction = this.direction;

        // Before sprite rotation, let's check we are not out of screen
        // Otherwise, change direction to opposite:
        if ((this.offset.left <= 10 || this.offset.top <= 10) ||
            (this.offset.left >= this.max_w+10 || this.offset.top >= this.max_h+10)) {
            direction += 180;
        }
        direction = check_degree(direction); // <=360, >=0
        
        // Rotate sprite(wrapper) to successfuly direction by using css3:
        if (direction != this.direction) this.$wrap.css({'transform' : 'rotate('+ direction +'deg)'});

        var step_size = this.step_size;
        
        // Count dx, dy difference by direction and "move" wrapper:
        this.offset.left += parseInt(step_size * Math.cos(degreesToRadians(direction)));
        this.offset.top  += parseInt(step_size * Math.sin(degreesToRadians(direction)));
        this.$wrap.offset(this.offset);
      
        // Store new direction anyway:
        this.direction = direction;

        // Show next sprite:
        this._draw_img_next();
    }


    // Run BUG in randomized direction:
    proto.run_random = function() {
        // Check if we should change the direction:
        var change_direction = Math.random() > this.rand_direction_chance ? true : false;
        //var change_direction = Math.random()*1000 > 800 ? true : false;
        var direction = this.direction;
        if (change_direction) {
            // Let's randomize it: (we should change direction only on some little difference)
            var direction_diff = parseInt(Math.random() * this.rnd_dir_diff) - (this.rnd_dir_diff/2);
            direction += direction_diff;
            direction = check_degree(direction); // <=360, >=0
            
            if (opts.debug >= 3) console.log("NEW DIRECTION DEG: " + direction);

            // Image is not currently displayed by browser, we can't get currect height, 
            // we can't rotate it without bugs, so go out:
            if (!this.$img.outerHeight(false)) return;
        }
        this.run(direction);
    }

    // Check go_queue list as often as possible:
    proto.start = function() {
        var this_ = this;
        this.iv_go_queue_running_check = setInterval(function() {
            this_.go_queue_run();
        }, opts["queue_interval"]);
        return this;
    }

    // Stop checking go_queue list:
    proto.stop = function() {
        if (this.iv_go_queue_running_check) clearInterval(this.iv_go_queue_running_check);
        return this;
    }

    // Add new action into go_queue:
    proto.runto = function(direction, distance, speed, sleep_before, callback) {
        if (!sleep_before) sleep_before = 0;
        if (this._go_queue.length >= go_queue_max_history) {
            this._go_queue.splice(0, this._go_queue.length-go_queue_max_history);
        }
        this._go_queue.push([sleep_before, distance, direction, speed, callback]);
    }

    // Make movements by this._go_queue queue:
    proto.go_queue_run = function() {

        // Nothing to do:
        if (this.min_queue && this.$img.is(":hidden") && this._go_queue.length < this.min_queue) return;
 
        if (this._go_queue.length == 0) {
            return;
        }
        if (this.iv_random_mouse_running && this._go_queue.length == 1 && this.is_visible) {
            this.hide(this.fadeout); 
        }
        //if (this.$img.is(":hidden")) {
        else if (this.iv_random_mouse_running && !this.is_visible && this.$img.is(":hidden")) {
            this.make_random_offset();
            this.show(null, this.fadein);
        }

        // Bug is allready running, let's wait last go_queue command stops:
        if (this._go_queue_runing) return;

        // Set, that running process is active:
        this._go_queue_runing = true;

        // Get next go_queue action, "dt_" contains array of [TIME, STEPS, DIRECTION, SPEED]
        // where TIME - time to do nothing before the action(mSec/5)
        // STEPS - number of movement steps
        // DIRECTION - 0-360 degrees
        // SPEED - step interval timeout, 1/1000 sec
        var dt_ = this._go_queue.shift();
        if (opts.debug >= 1) console.log("myBug: QUEUE LENGTH: " + this._go_queue.length);

        var direction = dt_[2]; // If no direction - randomized runing
        var speed = dt_[3] || this.speed; // BUG SPEED

        // Show sprite, sleep dt_[0] and then run dt_[1] steps:
        var this_ = this;
        setTimeout(function() {
            if (opts["on_action"]) opts["on_action"].call(this_, dt_[1], direction, speed);
            this_._go_queue_run(dt_[1], direction, speed, dt_[4]);
        }, dt_[0]);

    }


    // Run to some distance:
    proto._go_queue_run = function(dist, direction, iv_timeout, callback) {
        var count = 0;
        var iv = null; // it would be an interval, that we should clear when action stops
        var this_ = this;

        if (opts.debug >= 1) console.debug("RUNNING DISTANCE: " + dist + " STEPS");

        // Func. that we should start periodically with iv_timeout speed:
        var _run = function() {
            count += 1;
            if (count >= dist) {
                // The distance traversed! Clear iv, and set that we're ready to other go_queue action:
                clearInterval(iv);
                this_._go_queue_runing = false;
                if (callback) callback.call(this_);
            }
            // Run one step:
            if (!direction && direction != 0) {
                // If no direction specified, run on random direction:
                this_.run_random();
            } else {
                this_.run(direction);
            }
        }
        iv = setInterval(_run, iv_timeout);
    }


    // Setup our bug to run on mousemove event
    // All mousemoves will be collected with it's distances and time differences
    proto.start_random_mouse_running = function() {
        var 
            time_max_sleep = 3000, // BUG's max sleeping time, 1/1000 second; 0 - disabled
            time_movement_limit = 400, // If mouse stops more then this value - count as new movement
            time_diff_coef = 0.5, // Coefficient of BUG sleeping time;
                                // It should sleeps mouse sleep time * time_diff_coef
            distance_coef = 1/7, // Coefficient of BUG speed. Every movement is realy slow, 
                                    // so, we should decrease BUG movements in comparison with mouse distances
            distance_min   = 20,  // Minimum distance to run in steps
            distance_limit = 300; // Limit maximum bug distance, 0 - unlimited
            
            
        this.init();
        var this_ = this;

        // How long we should collect mouse events before make our BUG movements?
        var collect_events_timeout = 5000; // mSec (1/1000 sec)

        // Check mouse movements history and make go_queue list every collect_events_timeout:
        this.iv_random_mouse_running = setInterval(function() {
            var next_distance = 0; // count next_distance for go_queue
            var t_diff = 0;
            var last_time = 0;
            // this_._mouse_history is an Array, where each element is dataset: 
            // [0] - movement time (unixtime)
            // [1] - X distance
            // [2] - Y distance
            for (var i in this_._mouse_history) {
                next_distance += (this_._mouse_history[i][1]+this_._mouse_history[i][2]);

                t_diff += (last_time == 0 ? 0 : this_._mouse_history[i][0] - last_time);
                last_time = this_._mouse_history[i][0];
                // If timedifference between current and last movements is more then time_movement_limit mSecs
                // store this movement to go_queue list:
                if (t_diff > time_movement_limit) {
                    t_diff = t_diff*time_diff_coef;
                    if (time_max_sleep > 0 && t_diff > time_max_sleep) t_diff = time_max_sleep;

                    var new_dist = parseInt(next_distance*distance_coef);
                    if (distance_limit>0 && new_dist > distance_limit) new_dist = distance_limit;
                    if (new_dist < distance_min) new_dist = distance_min;
                    this_.runto(null, new_dist, null, t_diff);
                    next_distance = 0;
                    t_diff = 0;
                }
            }
            // Clear mouse history for appanding new actions:
            this_._mouse_history.length = 0;
        }, collect_events_timeout);

        // Cache and store into this_._mouse_history every mousemove event: (time and distance)
        var x = cacheX = 0;
        var y = cacheY = 0;
        var last_time;
        var time_diff = 0;
        $(document).on("mousemove", function(e) {
            if (!e) e = event;
            cacheX < e.clientX ? x += e.clientX - cacheX : x += cacheX - e.clientX;
            cacheY < e.clientY ? y += e.clientY - cacheY : y += cacheY - e.clientY;
            cacheX = e.clientX;
            cacheY = e.clientY;
            if (last_time) {
                time_diff += new Date().getTime() - last_time;
            } else {
                last_time = new Date().getTime();
            }
            if (time_diff > time_movement_limit) {
                this_._mouse_history.push([new Date().getTime(), x, y]);
                x = y = 0;
            }
        });

    }

    // Stom go_queue_random_running process, just clear intervals:
    proto.stop_random_mouse_running = function() {
        if (this.iv_random_mouse_running) clearInterval(this.iv_random_mouse_running);
    }

    return new baseClass;
}





