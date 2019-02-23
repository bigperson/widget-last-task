// 'use strict';
// define(['https://widget//script.js?v='+Math.random()], function (widget) {
//     return widget;
// });
define(['jquery'], function($){
    var CustomWidget = function () {
    	var self = this,
			system = self.system;

    	this.get_settings = function () {
    	    var tp;
            $.ajax({
                type: 'POST',
                cache: false,
                dataType: 'json',
                async: false,
                url: 'https://new5c608a588697c.amocrm.ru/ajax/widgets/list',
                data: '',
                success: function (data) {
                    tp=JSON.parse(data.widgets.last_task.settings);
                }
            });
            return tp;
        };

    	this.set_settings = function (codeField, formul) {
    	    var data = self.get_settings();
    	    data[codeField] = formul;

            $.post('https://new5c608a588697c.amocrm.ru/ajax/widgets/edit', {
                    action: 'edit',
                    id: '344938',
                    code: 'last_task',
                    widget_active: 'Y',
                    settings: data
            }, function () {
                console.log(self.get_settings());
            });
        };

    	this.delete_settings = function (codeFiled) {
            var data = self.get_settings();
            delete data[codeFiled];
            $.post('https://new5c608a588697c.amocrm.ru/ajax/widgets/edit', {
                action: 'edit',
                id: '344938',
                code: 'last_task',
                widget_active: 'Y',
                settings: data
            }, function () {
                console.log(self.get_settings());
            });
        };

    	this.getFieldsNames = function () {
            var fieldsNames = [];
			fieldsNames.push({option: 'Бюджет', id: 'sale'});

			//Получаю все имена и id всех кастомных полей, а также поля бюджет, и заношу их в объект fieldsNames
			//Берет только поля типа число
            $.get('https://new5c608a588697c.amocrm.ru/api/v2/account?with=custom_fields', function (data) {
                var leads = data._embedded.custom_fields.leads;
                for (key in leads){
                    if(leads[key].field_type == 2){
                        fieldsNames.push({option: leads[key].name, id: leads[key].id});
                    }
                }
                //Выбор кастомного поля, чтобы создать для него формулу
                $('#work-area-last_task').append(self.render(
                    {ref: '/tmpl/controls/select.twig'},// объект data в данном случае содержит только ссылку на шаблон
                    {
                        items: fieldsNames,
                        id: 'mainField',   //указание id
                    })
                );
                $('.control--select--button ').css('width', '15%');
                $('.control--select').append('=');

                //Поле для ввода формулы
                $('.control--select').append(self.render(
                    {ref: '/tmpl/controls/input.twig'},// объект data в данном случае содержит только ссылку на шаблон
                    {
                        id: 'formulField'   //указание id
                    }));
                $('#formulField').css('width', '50%');

                //Кнопка для сохранения формулы
                $('.control--select').append(self.render(
                    {ref: '/tmpl/controls/button.twig'},// объект data в данном случае содержит только ссылку на шаблон
                    {
                        id: 'buttonSaveFormul'   //указание id
                    }));
                $('span.button-input-inner').append('Создать формулу');
                $('#buttonSaveFormul').css('background', '#4c8bf7').css('color', '#fff');

                $('#buttonSaveFormul').on('click', function () {
                    if(self.validateFormul($('#formulField').val(), fieldsNames, $('.control--select--button-inner').text())){
					    alert('Сохранено');
                        $('#formulField').css('border', '1px solid rgb(0,255,0)');
					    self.set_settings($('.control--select--button').attr('data-value'), $('#formulField').val())
                    }
                    else{
					    alert("Не правильное оформление");
					    $('#formulField').css('border', '1px solid rgb(255,0,0)')
                    }
                })
            });
        };

    	//Функция отрисовывает все существующие формулы на странице расширненных настроек
        this.getFormuls = function () {
            var formuls = self.get_settings();
            console.log(formuls);
            for(key in formuls){
                if(key != 'login'){
                    $('#work-area-last_task').append('<div id="'+ key +'">'+ key +'='+ formuls[key] +'</div>');
                    $('#'+key).append(self.render(
                        {ref: '/tmpl/controls/button.twig'},// объект data в данном случае содержит только ссылку на шаблон
                        {
                            id: 'buttonDeleteFormul' + key   //указание id
                        }));
                    $('#buttonDeleteFormul' + key + ' span').append('Удалить');
                    $('#buttonDeleteFormul' + key).css('background', 'rgb(240,0,0)').css('color', '#fff');
                }
            }
            $('[id^="buttonDeleteFormul"]').on('click', function () {
                alert('Удалено');
                self.delete_settings($(this).attr('id').slice(-6))
            })
        };

    	//Валидация формулы, mainField не должен повторяться в тексте формулы, все поля используемые в формуле должны существовать
    	this.validateFormul = function (formul, fieldsNames, mainField) {
    		// console.log(formul, fieldsNames, mainField);
    		var arrFormul = self.parseFormul(formul),
                checkFieldIs = false;
    		// console.log(arrFormul);
    		if(!arrFormul){
    		    return false
            }
            for(i=0; i<arrFormul.length; i++){
    		    if(arrFormul[i].length > 1){
    		        if(arrFormul[i] == mainField){
    		            return false
                    }
                    for(j=0; j<fieldsNames.length; j++){
    		            if(arrFormul[i] == fieldsNames[j].option){
    		                break;
                        }
                        else if(j == fieldsNames.length-1){
    		                return false;
                        }
                    }
                }
            }
			return true;
        };

    	//parse текста формулы в массив, первый элемент может быть либо "(", либо имя поля,
        //bracketCount на выходе должен быть равен 0 и не должен становиться <0 во время процесса
    	this.parseFormul = function (formul) {
    		var bracketCount = 0,
    			arrFormul = [],
				arrSymbols = '()+-*/0123456789',
				arrField = '';
			for(i=0; i<formul.length; i++){
				if(arrSymbols.indexOf(formul[i]) != -1){
					arrField = '';
					if(arrSymbols.indexOf(formul[i]) == 0){
						bracketCount++;
					}
					else if(arrSymbols.indexOf(formul[i]) == 1){
						bracketCount--;
					}
					if(bracketCount < 0){
					    return false;
                    }
					arrFormul.push(formul[i]);
				}
				else{
					arrField = arrField + formul[i];
					if(arrSymbols.indexOf(formul[i+1]) != -1 || i == formul.length-1){
						arrFormul.push(arrField);
					}
				}
			}
			if((arrSymbols.indexOf(arrFormul[0]) == 0 || arrFormul[0].length > 1) && bracketCount == 0){
				return arrFormul;
			}
			return false;
        };

        this.callbacks = {
			render: function(){
			    console.log('render');
				return true;
			},
			init: function(){
			    console.log('init');
				return true;
			},
			bind_actions: function(){
			    console.log('bind_action');
				return true;
			},
            advancedSettings: function()
			{
			    console.log('advanced');
			    self.set_settings('login','Ziaboss');
                self.getFieldsNames();
                self.getFormuls();
            },
			settings: function(){
			    console.log('settings');
				return true;
			},
			onSave: function(){
				return true;
			},
			destroy: function(){

			},
			contacts: {
					//select contacts in list and clicked on widget name
					selected: function(){
						console.log('contacts');
					}
				},
			leads: {
					//select leads in list and clicked on widget name
					selected: function(){
						console.log('leads');
					}
				},
			tasks: {
					//select taks in list and clicked on widget name
					selected: function(){
						console.log('tasks');
					}
				}
		};
		return this;
    };

return CustomWidget;
});
