function media(){
    var a = parseFloat(document.getElementById("nota1").value)
    var b = parseFloat(document.getElementById("nota2").value)
    var c = parseFloat(document.getElementById("nota3").value)
    var respMedia = document.getElementsById("resposta")
    var media= (a + b + c) / 3

    if(media >= 7){
        respMedia.textContent = `${media.toFixed(2)} - PASSOU DE ANO ✅`
    } else {
        respMedia.textContent = `${media.toFixed(2)} - REPROVOU DE ANO ❌`
    }
}
