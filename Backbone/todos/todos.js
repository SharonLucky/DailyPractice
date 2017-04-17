$(function () {


    var Todo = Backbone.Model.extend({

        defaults: function () {
            return {
                title: "empty todo...",
                order: Todos.nextOrder(),
                done: false
            };
        },

        toggle: function () {
            this.save({done: !this.get("done")});
        }

    });

    var TodoList = Backbone.Collection.extend({
        model: Todo,
        localStorage: new Backbone.LocalStorage("todos-backbone"),
        done: function () {
            return this.where({done: true});
        },
        remaining: function () {
            return this.where({done: false});
        },
        nextOrder: function () {
            if (!this.length) return 1;
            return this.last().get('order') + 1;
        },

        //Backbone内置属性，指明collection的排序规则。
        comparator: 'order'

    });

    var Todos = new TodoList;

// 先来看TodoView，作用是控制任务列表
    var TodoView = Backbone.View.extend({

        //下面这个标签的作用是，把template模板中获取到的html代码放到这标签中。
        tagName: "li",

        // 获取一个任务条目的模板,缓存到这个属性上。
        template: _.template($('#item-template').html()),

        /// 为每一个任务条目绑定事件
        events: {
            "click .toggle": "toggleDone",
            "dblclick .view": "edit",
            "click a.destroy": "clear",
            "keypress .edit": "updateOnEnter",
            "blur .edit": "close"
        },

        ///在初始化时设置对model的change事件的监听
        //设置对model的destroy的监听，保证页面数据和model数据一致
        initialize: function () {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        // 渲染todo中的数据到 item-template 中，然后返回对自己的引用this
        render: function () {
            //console.log(this.$el)
            //console.log(this.model)
            //console.log(this.model.toJSON())
            this.$el.html(this.template(this.model.toJSON()));
            this.$el.toggleClass('done', this.model.get('done'));
            this.input = this.$('.edit');
            return this;
        },

        toggleDone: function () {
            this.model.toggle();
        },
        // 修改任务条目的样式
        edit: function () {
            this.$el.addClass("editing");
            this.input.focus();
        },

        // 关闭编辑模式，并把修改内容同步到Model和界面
        close: function () {
            var value = this.input.val();
            if (!value) {
                this.clear();
            } else {
                this.model.save({title: value});
                this.$el.removeClass("editing");
            }
        },

        // 按下回车之后，关闭编辑模式
        updateOnEnter: function (e) {
            if (e.keyCode == 13) this.close();
        },

        // 移除对应条目，以及对应的数据对象
        clear: function () {
            this.model.destroy();
        }

    });

    var AppView = Backbone.View.extend({

        el: $("#todoapp"),

        // 在底部显示的统计数据模板
        statsTemplate: _.template($('#stats-template').html()),

        events: {
            "keypress #new-todo": "createOnEnter",
            "click #clear-completed": "clearCompleted",
            "click #toggle-all": "toggleAllComplete"
        },

        //在初始化过程中，绑定事件到Todos上，
        //当任务列表改变时会触发对应的事件。
        //最后从localStorage中fetch数据到Todos中。
        initialize: function () {

            this.input = this.$("#new-todo");
            this.allCheckbox = this.$("#toggle-all")[0];

            this.listenTo(Todos, 'add', this.addOne);
            this.listenTo(Todos, 'reset', this.addAll);
            this.listenTo(Todos, 'all', this.render);

            this.footer = this.$('footer');
            this.main = $('#main');

            Todos.fetch();
        },

        // 更改当前任务列表的状态
        render: function () {
            var done = Todos.done().length;
            var remaining = Todos.remaining().length;

            if (Todos.length) {
                this.main.show();
                this.footer.show();
                this.footer.html(this.statsTemplate({done: done, remaining: remaining}));
            } else {
                this.main.hide();
                this.footer.hide();
            }
            console.log(remaining)
            this.allCheckbox.checked = !remaining;
        },

        //根据剩余多少未完成确定标记全部完成的checkbox的显示
        // 添加一个任务到页面id为todo-list的div/ul中
        addOne: function (todo) {
            var view = new TodoView({model: todo});
            this.$("#todo-list").append(view.render().el);
        },

        // 把Todos中的所有数据渲染到页面,页面加载的时候用到
        addAll: function () {
            Todos.each(this.addOne, this);
        },

        //生成一个新Todo的所有属性的字典
        createOnEnter: function (e) {
            if (e.keyCode != 13) return;
            if (!this.input.val()) return;

            Todos.create({title: this.input.val()});
            this.input.val('');
        },

        //去掉所有已经完成的任务
        clearCompleted: function () {
            // 调用underscore.js中的invoke方法
            //对过滤出来的todos调用destroy方法
            _.invoke(Todos.done(), 'destroy');
            return false;
        },

        toggleAllComplete: function () {
            var done = this.allCheckbox.checked;
            Todos.each(function (todo) {
                todo.save({'done': done});
            });
        }

    });

    // Finally, we kick things off by creating the **App**.
    var App = new AppView;

});
