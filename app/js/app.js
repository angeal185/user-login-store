_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

const mainTpl = _.template('<div class="main container"><div class="row"></div></div>'),
navTpl = _.template('<nav><div class="nav-wrapper"><a href="#" class="brand-logo center">User store</a></div></nav>'),
navBtmTpl = _.template('<div class="nav-bottom"></div>'),
inpTpl = _.template('<div class="col s6"><label>{{_.capitalize(i)}}</label><input type="password" id="{{i}}"></div>'),
taTpl = _.template('<div class="col s12"><label>import</label><textarea type="password" id="importSel" class="materialize-textarea"></textarea></div>'),
btnTpl = _.template('<div class="col s6"><button type="button" id="{{i}}" class="btn w100 mt20 waves-effect">{{_.capitalize(i)}}</button></div>'),
globeTpl = _.template('<div class="globe {{i}} green"></div>'),
toastTpl = _.template('<div class="toast disposable fadeOutDown"></div>');

$('body').prepend(navTpl(),mainTpl(),navBtmTpl());

_.forEach(['username','password'],function(i){
  $('.main > .row').append(inpTpl({i:i}))
})

$('.main > .row').append(taTpl())

_.forEach(['import','submit'],function(i){
  $('.main > .row').append(btnTpl({i:i}))
})

_.forEach(['left','right'],function(i){
  $('.nav-bottom').append(globeTpl({i:i}))
})

$('.nav-bottom').after(toastTpl())

$(document).ready(function() {

  csl.get(function(i){
    if(_.isEmpty(i)){
      $('.globe').eq(0).removeClass('green').addClass('red')
      toasty('data empty, import to proceed');
      $('#submit').attr('disabled',true);
    }
  })
  $('#import').on('click', function() {
    importItem()
  });
  $('#submit').on('click', function() {
    submitItem()
  });
});
