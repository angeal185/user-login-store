let csl = chrome.storage.local;

var crypt = {
  h2b: function(i){
    return forge.util.hexToBytes(i);
  },
  b2h: function(i){
    return forge.util.bytesToHex(i);
  },
  sha256: function(i){
    var md = forge.md.sha256.create();
    md.update(i);
    return md.digest().toHex();
  },
  sha512: function(i){
    var md = forge.md.sha512.create();
    md.update(i);
    return md.digest().toHex();
  },
  gcmEnc: function(key, text){
    try {
      let fu = forge.util,
      iv = forge.random.getBytesSync(16),
      cipher = forge.cipher.createCipher('AES-GCM', fu.hexToBytes(key));
      cipher.start({
        iv:iv
      });
      cipher.update(fu.createBuffer(fu.createBuffer(text, 'utf8')));
      cipher.finish();
      let final = _.join([
        fu.bytesToHex(cipher.output.getBytes()),
        fu.bytesToHex(iv),
        fu.bytesToHex(cipher.mode.tag.getBytes())],':')
      return final;
    } catch (err) {
      toasty('encrypt error')
    }
  },
  gcmDec: function(key,text){
    try {
      let fu = forge.util,
      sep = _.split(text,':', 3),
      decipher = forge.cipher.createDecipher('AES-GCM', fu.hexToBytes(key));
      decipher.start({
        iv: fu.hexToBytes(sep[1]),
        tag: fu.createBuffer(fu.hexToBytes(sep[2]))
      });
      decipher.update(fu.createBuffer(fu.hexToBytes(sep[0])));
      decipher.finish();
      return decipher.output.toString('utf8')
    } catch (err) {
      toasty('decrypt error')
    }
  },
  pbkdf2: function(pass,salt){
    try{
      return forge.pkcs5.pbkdf2(crypt.sha256(pass), crypt.sha256(salt), '10000', 32);
    } catch (err) {
      toasty('pbkdf2 error')
    }
  }
}


function importItem(){
    try{
      let obj = $('#importSel').val(),
      user = $('#username').val(),
      pass = $('#password').val();

      if(_.eq(obj,'') || _.eq(user,'') || _.eq(pass,'')){
        return toasty('username, password and import fields cannot be empty')
      }
      obj = JSON.parse(obj)

      _.forIn(obj,function(x,y){
        obj[y] = crypt.gcmEnc(crypt.pbkdf2(pass,user),x)
      })
      csl.set(obj)
      $('#importSel').val('')
      $('#submit').attr('disabled',false);
      $('.globe').eq(0).removeClass('red').addClass('green')
      toasty('import success')
    } catch(err){
      if (err){
        return toasty('import failure')
      }
    }
}

function submitItem(){
  try{
    csl.get(function(i){
      let user = $('#username').val(),
      pass = $('#password').val(),
      res = true;

      if(_.eq(user,'') || _.eq(pass,'')){
        $('.globe').eq(1).removeClass('green').addClass('red')
        return toasty('username and password fields cannot be empty')

      }

      _.forIn(i,function(x,y){
        i[y] = crypt.gcmDec(crypt.pbkdf2(pass,user),x)
      })

      _.forIn(i,function(x){
        if(_.isUndefined(x)){
          res = false
        }
      })

      if(!res){
        $('.globe').eq(1).removeClass('green').addClass('red')
        return toasty('incorrect details')
      }

      let cmd = "document.getElementById('username').value = '"+ i.username +"';" + "document.getElementById('password').value = '"+ i.password +"';"+
      "document.getElementById('token').value = '"+ i.token +"';"
      chrome.tabs.executeScript({
        code: cmd
      });

      $('.globe').eq(1).removeClass('red').addClass('green')
      toasty('submit success')
      return;
    })
  } catch(err){
    if (err){
      $('.globe').eq(1).removeClass('green').addClass('red')
      return toasty('incorrect details')
    }
  }
}

//enable privacy
function initPrivacy(){
  let cps = chrome.privacy.services,
  arr = [
    'autofillAddressEnabled',
    'autofillCreditCardEnabled',
    'autofillEnabled',
    'passwordSavingEnabled',
    'searchSuggestEnabled',
    'spellingServiceEnabled',
    'translationServiceEnabled'
  ]

  _.forEach(arr, function(i){
    try{
      cps[i].set({value: false})
      cps[i].get({}, function(x) {
        if (x.value){
          toasty(i + ' not disabled!')
        }
      });
    } catch(e){
      if (e) { console.log(i + ' not disabled!') }
    }
  })
}


function toasty(i){
  let toasty = $('.toast.disposable')
  toasty.text(i).removeClass('fadeOutDown').addClass('fadeInUp');
  setTimeout(function () {
      toasty.removeClass('fadeInUp').addClass('fadeOutDown');
  }, 2500);
}


function getVersion(){
  return chrome.runtime.getManifest().version;
}

function checkVersion(i){

  if(i.version.toDate){
    $.ajax({
      url: 'https://raw.githubusercontent.com/angeal185/user-store/master/package.json',
      type: 'GET',
      dataType: 'json'
    })
    .done(function(data) {
      try {
        let current = parseInt(_.replace(data.version, /\./g, '')),
        app = parseInt(_.replace(getVersion(), /\./g, ''));
        if(_.gt(current,app)){
          i.version.toDate = false;
          csl.set(i)
          vc('orange')
          toasty('update available')
        } else {
          i.version.lastCheck = Date.now();
          csl.set(i)
          vc('green')
          toasty('up to date')
        }
      } catch (err) {
        if (err) {
          vc('red')
          toasty("unable to check for updates");
        }
      }
    })
    .fail(function() {
      vc('red')
      toasty("unable to check for updates");
    })
  } else {
    vc('orange')
    toasty('update available')
  }

}

function versionInt(){
  csl.get(function(i){
    if(!i.version.toDate){
      vc('orange')
      toasty('update available')
      return;
    }

    if(_.lt((i.version.lastCheck + 10800000), Date.now())){
      checkVersion(i)
    } else {
      vc('green')
      toasty('up to date')
    }
    return;
  })
}

function vc(i){
  $('.version').addClass(i)
}

initPrivacy()
