function somar(){
    var n1 = document.getElementById("n1").valueAsNumber;
    var n2 = document.getElementById("n2").valueAsNumber;
    var resposta = document.getElementById("resposta")
    resposta.textContent = n1 + n2
}
function sub(){
    var n3 = document.getElementById("n3").valueAsNumber;
    var n4 = document.getElementById("n4").valueAsNumber;
    var respSub = document.getElementById("respSub")
    respSub.textContent = n3 - n4
}
function mult(){
    var n5 = document.getElementById("n5").valueAsNumber;
    var n6 = document.getElementById("n6").valueAsNumber;
    var respMult = document.getElementById("respMult")
    respMult.textContent = n5 * n6
}
function divs(){
    var n7 = parseFloat(document.getElementById("n7").value)
    var n8 = parseFloat(document.getElementById("n8").value)
    var respDIvs = document.getElementById("respDivs")
    
    if(n4 !== 0){
        respDIvs.textContent = n7 / n8
    }
        
    else{
        respDIvs.textContent = "Não se Divide por 0"
    }
    
}