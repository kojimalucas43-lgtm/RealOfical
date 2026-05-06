function mostrar(){
    var texto = document.getElementById('i1').value
    var printTexto = document.getElementById('printTexto')

    var cor = document.getElementById('i2').value
    var printColor = document.getElementById('printColor')
   
    var data = document.getElementById('i3').value
    var printColor = document.getElementById('printData')

    var check = document.getElementById('i4').checked
    var printColor = document.getElementById('printCheck')

    printTexto.textContent = `O Texto Digitado Foi: ${texto}`
    printTexto.innerHTML = `A Cor Escolhida Foi: ${cor}`
    printData.innerHTML = `A Data Escolhida Foi: ${data}`
    printCheck.textContent = `Você escolheu: ${check}`

    // console.log(texto, typeof texto)

}