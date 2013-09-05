RestDB - Filesystem based expressjs Middleware
==============================================

Simple filesystem based rest database. designed as a expressjs middleware.


```javascript
var fs      =   require('fs');
var path    =   require('path');
var express =   require('express');
var restdb  =   require('restdb');

var DATA_DIRECTORY = "data"

var app = express();
var port = process.env.PORT || 6060;

app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(function(req, res, next) {
        console.log('Request received for: ['+req.method+'] :'+req.url);
        next();
    });
    app.use(function(err, req, res, next){
        console.error(err.stack);
        res.send(500, 'Something broke!');
    });
    app.use(express.static('public'));


    function fnDataDirectory(req, res){ return DATA_DIRECTORY };
    function fnAuthenticate(req, res, next){
        next();
        //res.send(401, {status:401});
    };
    function fnGetOwnerId(req, res){ return 'mahes' };

    var rest_api_options = {
        datadir: fnDataDirectory,
        authenticate: fnAuthenticate,
        owner: fnGetOwnerId
    };


    // creates the following rest routes.
    // GET    /:entity
    // GET    /:entity/:id
    // PUT    /:entity/:id
    // POST   /:entity
    // DELETE /:entity/:id
    //        /admin/entities

	app.use('/api', restdb(rest_api_options).middleware);

});


var server = app.listen(port);


```

Sample Todo app developed with Angular JS

```html
<!DOCTYPE html>
<html ng-app="todoapp">
<head>
    <title>ToDo List using AngularJs</title>
    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.0.7/angular.min.js"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.0.1/angular-resource.min.js"></script>
</head>
<body>

<div ng-controller="todo">
    <h3>Tasks</h3>
    <p>
        <span>New task:</span>
        <input type="text" ng-model="newtodo.title"/>
        <button class="btnAdd" ng-click="addTodo(newtodo)">Add</button>
    </p>
    <ul>
        <li ng-repeat="todo in todos">
            {{todo.id}}
            <input type="text" id="title" ng-model="todo.title"/>
            <button class="btnUpdateTodo" ng-click="updateTodo(todo)">Update</button>
            <button class="btnDeleteTodo" ng-click="deleteTodo(todo, $index)">X</button>
        </li>
    </ul>
</div>


<script type="text/javascript">

var app = angular.module('todoapp', ['ngResource']);

function todo($scope, $resource) {

    var ToDo = $resource('/api/actions/:id', {id: "@id"}, {'put': {method:'PUT'}} );

    $scope.todos = [];

    ToDo.query(function(todos) { $scope.todos = todos; });

    $scope.addTodo = function(newtodo){
        ToDo.save(newtodo, function(t){
            $scope.todos.push(t);
        });
    };
    $scope.updateTodo = function(todo){
        ToDo.put(todo, function(t){ });
    };
    $scope.deleteTodo = function(todo, idx){
        ToDo.delete({id:todo.id}, function(){
            $scope.todos.splice(idx, 1);
        });
    };

}

</script>


</body>
</html>
```

