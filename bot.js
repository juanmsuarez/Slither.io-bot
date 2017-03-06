/* Some game variables:
  window.gsc is the general scale (used to zoom in and out of the game).
  window.snake.ehang is the snake's angle. Range: -PI to PI.
  window.snake.ang is the snake's angle. Range: 0 to 2*PI.
  window.snake.sc is the snake's scale (how wide it is).
*/

var util = {
  setMouseCoordinates: function(point) {
    window.xm = point.x;
    window.ym = point.y;
  },

  mapToMouse: function(point) {
    var mouseX = (point.x - window.snake.xx) * window.gsc;
    var mouseY = (point.y - window.snake.yy) * window.gsc;

    return {
      x: mouseX,
      y: mouseY
    };
  },

  calculateDistance2: function(x1, y1, x2, y2) {
    return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
  },

  circle: function(x, y, r) {
    return {
      x: Math.round(x),
      y: Math.round(y),
      r: Math.round(r)
    };
  },

  circlesIntersect: function(c1, c2) {
    var intersect = false;
    var radiusesSum = c1.r + c2.r;

    if (Math.abs(c1.x - c2.x) + Math.abs(c1.y - c2.y) <= radiusesSum) {
      var distance2 = calculateDistance2(c1.x, c1.y, c2.x, c2.y);

      if (distance2 <= radiusesSum * radiusesSum)
        intersect = true;
    }

    return intersect;
  }
};


// Bot object
var bot = {

  opt: {
    fps: 30,
    foodFrames: 4,
    foodRoundSize: 5,
    foodRoundAngle: Math.PI/8,
    currentFood: null,
    // radius multiple for circle intersects
    radiusMult: 10,
    // base speed
    baseSpeed: 5.78
  },

  getSnakeWidth: function(scale) {
    if (scale === undefined) scale = window.snake.sc;
    return Math.round(scale * 29.0); // Snake's scale times the original width.
  },

  // TODO: check and avoid collisions.
  checkCollisions: function() {

  },

  // Creates food clusters and decides which one is the best option.
  computeFoodGoal: function() {
    var foodClusters = [];
    var getClusterIndex = {}; // TODO: can we avoid using getClusterIndex?

    for (var i = 0; i < window.foods.length && window.foods[i] !== null; i++) {
      var food = window.foods[i];
      // TODO: avoid this food if it makes the snake loop in a circle.
      if (!food.eaten) {
        // Calculate the coordinates of the cluster that this food belongs to.
        var clusterX = Math.round(Math.round(food.xx / bot.snakeWidth) * bot.snakeWidth);
        var clusterY = Math.round(Math.round(food.yy / bot.snakeWidth) * bot.snakeWidth);

        if (getClusterIndex[clusterX + ',' + clusterY] === undefined) {
          // There is no cluster in this position, create a new cluster.
          // TODO: Change to a faster implementation of atan2?
          var clusterAngle = Math.atan2(clusterY - window.snake.yy, clusterX - window.snake.xx);
          var snakeAngle = window.snake.ehang;
          var movementAngle = Math.min(2*Math.PI - Math.abs(snakeAngle - clusterAngle), Math.abs(snakeAngle - clusterAngle));
          var size = Math.round(food.sz);
          var distance = Math.round(util.calculateDistance2(clusterX, clusterY, window.snake.xx, window.snake.yy));

            getClusterIndex[clusterX + ',' + clusterY] = foodClusters.length;
            foodClusters[foodClusters.length] = {
              x: clusterX,
              y: clusterY,
              angle: clusterAngle,
              movementAngle: movementAngle,
              size: size,
              distance: distance,
              score: 0.0
            };
        }
        else
          // There is a cluster created in this position.
          foodClusters[getClusterIndex[clusterX + ',' + clusterY]].size += Math.round(food.sz);
      }
    }

    // Score each food cluster.
    // TODO: try other score functions. Maybe try removing the ceil function?
    foodClusters.forEach(function(food) {
      var weightedSize = Math.pow(Math.ceil(food.size / bot.opt.foodRoundSize) * bot.opt.foodRoundSize, 2);
      var weightedAngle = Math.ceil(food.movementAngle / bot.opt.foodRoundAngle) * bot.opt.foodRoundAngle;

      food.score = weightedSize / food.distance / weightedAngle;
    });

    // Sort the food clusters acoording to their score.
    foodClusters.sort(function(foodA, foodB) {
      return foodB.score - foodA.score;
    });

    // TODO: check collisions

    bot.currentFood = foodClusters[0];
  },

  actualizeValues: function() {
    bot.speedMult = window.snake.sp / bot.opt.baseSpeed;
    bot.snakeWidth = bot.getSnakeWidth();
    bot.snakeRadius = bot.getSnakeWidth() / 2;
  },

  go: function() {
    bot.actualizeValues();

    bot.computeFoodGoal();

    util.setMouseCoordinates(util.mapToMouse(bot.currentFood));

    window.setTimeout(bot.go, bot.opt.foodFrames * 1000/bot.opt.fps);
  }
};

(function mainLoop() {
  if (window.playing) {
    bot.go();
  }
})();
