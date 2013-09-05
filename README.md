## RestDB - Expressjs Middleware


Simple filesystem based rest database. designed as a expressjs middleware.



#### Note

* This is NOT a stable, scalable, production ready database. 
* Use only for learning frameworks like BackboneJS or AngularJS.
* This middleware stores data in filesystem under the specified data-directory.





### How to use

Just attach a middleware in your expressjs application like this

```javascript
	app.use('/myapi', require('restdb')({}).middleware);
```


the above line provides the following routes in expressJs Application.

```
     GET    /myapi/:entity
     GET    /myapi/:entity/:id
     PUT    /myapi/:entity/:id
     POST   /myapi/:entity
     DELETE /myapi/:entity/:id
```




### Accessing REST API with jQuery


Creating a resource with POST

```javascript
$.ajax({
    type: 'post',
    url: '/myapi/cheeses',
    data: { name: 'Cheddar', age: '1 day' }
});
```

Updating a resource with PUT

```javascript
$.ajax({
    type: 'put',
    url: '/myapi/cheeses/13579',
    data: { name: 'Cheddar', age: '10 day' }
});
```

Reading a resource with GET

```javascript
  $.getJSON("/myapi/cheeses/13579",
         function(data) {
            alert(data);
          });

```



### Sample ExpressJs Application

```javascript
var fs      =   require('fs');
var path    =   require('path');

var express =   require('express');	

var restdb  =   require('restdb');	//  <--- we are importing middleware code here

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


    function fnDataDirectory(req, res){ return DATA_DIRECTORY };	//  <--- data storage path in filesystem
    function fnAuthenticate(req, res, next){						//  <--- authentication routine if required
        next();				
        //res.send(401, {status:401});
    };
    function fnGetOwnerId(req, res){ return 'mahes' };				//  <--- optional _owner field for resource

    var rest_api_options = {
        datadir: fnDataDirectory,
        authenticate: fnAuthenticate,
        owner: fnGetOwnerId
    };

	app.use('/api', restdb(rest_api_options).middleware);

});


var server = app.listen(port);


```


### Sample Todo app developed with Angular JS

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

### Simple ToDo App using BackboneJS

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset=utf-8 />

    <script src="http://documentcloud.github.io/underscore/underscore-min.js"></script>
    <script src="http://documentcloud.github.io/backbone/backbone-min.js"></script>
    <script src="http://ajax.googleapis.com/ajax/libs/jquery/2.0.2/jquery.min.js"></script>

    <title>ToDo List using BackboneJs</title>
</head>
<body>

<script type="text/template" id="task_view_template">
    <input type="text" id="title"/>
    <button class="btnUpdateTodo">Update</button>
    <button class="btnDeleteTodo">X</button>
</script>

<script type="text/template" id="task_list_template">
    <h3>Tasks</h3>
    <p>New task: <input type="text" name="txtTaskName"/>
        <button class="btnAdd">Add</button></p>
    <ul></ul>
</script>



<div id="task_list_1"></div>
<div id="task_list_2"></div>


<script type="text/javascript">

    TaskModel = Backbone.Model.extend({ urlRoot:'/api/tasks'});
    TaskListModel = Backbone.Collection.extend({ url: '/api/tasks', model: TaskModel });

    TaskListView = Backbone.View.extend( {

        initialize: function(){
            _.bindAll(this, 'render');

            this.taskList = new TaskListModel();

            var thisView = this;

            this.taskList.fetch( {success: function(){
                console.log(thisView.taskList.models);
                thisView.render();
            }} );

            this.on('delete-task', function(idx){
                //this.tasks.splice(idx, 1);
                thisView.render();
            });
        },
        render: function(){
            var template = _.template( $("#task_list_template").html(), {} );
            this.$el.html( template );
            var thisView = this;
            this.taskList.models.forEach(function(ele,idx){
                ele.idx = idx;
                console.log(ele);
                console.log('title:::::'+ele.get('title'));
                thisView.$el.find('ul').append(new TaskView({task: ele, parentView: thisView }).el);
            });
        },
        events: {
            "click button.btnAdd" : "addTask",
            "click button.bntDeleteTodo" : "deleteTask"
        },
        addTask: function(){
            var taskModel = new TaskModel({title: this.$el.find('input[name="txtTaskName"]').val() });
            taskModel.save();
            this.taskList.add(taskModel);
            this.render();
        }
    });

    TaskView = Backbone.View.extend({

        initialize: function(v){
            this.task = v.task;
            this.parentView = v.parentView;
            _.bindAll(this, 'render', 'deleteTask', 'updateTask');
            this.render();
        },
        render: function(){
            var taskJson = this.task.toJSON();
            var template = _.template( $("#task_view_template").html(), {task: taskJson } );
            this.$el.html( template );
            this.$el.find('.btnDeleteTodo').data('index', taskJson.idx);
            this.$el.find('#title').val(taskJson.title);
        },
        events: {
            "click button.btnDeleteTodo" : "deleteTask",
            "click button.btnUpdateTodo" : "updateTask"
        },
        updateTask: function(evt){
            this.task.set('title', this.$el.find('#title').val());
            this.task.save();
            var idx = $(evt.target).data('index');
            this.render();
        },
        deleteTask: function(evt){
            this.task.destroy();
            var idx = $(evt.target).data('index');
            this.parentView.trigger('delete-task', idx);
            this.render();
        }
    });

    $(document).ready(function(){
        var taskListView = new TaskListView({ el: $("#task_list_1") });
    });

</script>


</body>
</html>
```