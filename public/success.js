let accountsElement = document.getElementById('accounts')
let emailElement = document.getElementById('email')
let orderIdElement = document.getElementById('order-id')
let priceElement = document.getElementById('price')
let quantityElement = document.getElementById('quantity')
let nameElement = document.getElementById('name')
let imageElement = document.getElementById('order-details-image-main')

let params = new URLSearchParams(window.location.search)
let id = params.get('id')

fetch('/checkout-session?id=' + id)
.then((Response) => Response.json())
.then((session) => {
    let quantity = session.line_items.data[0].quantity
    let email = session.customer_email
    emailElement.innerText = email
    let orderId = session.id
    orderIdElement.innerText = orderId
    let price = session.amount_total
    priceElement.innerText = '$' + (price / 100)
    quantityElement.innerText = quantity
    let name = session.line_items.data[0].description
    nameElement.innerText = name
    let image = session.metadata.itemImage
    imageElement.src = image

    fetch('/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: orderId
      }),
    })
    .then((Response) => Response.json())
    .then((orders) => {
      accountsElement.innerHTML = orders[0].accounts
    })
    .catch((error) => {
      console.error('Error:', error)
    })
})
.catch((error) => {
    console.error('Error:', error)
})

function notify(type,message){
    (()=>{
      let n = document.createElement("div");
      let id = Math.random().toString(36).substr(2,10);
      n.setAttribute("id",id);
      n.classList.add("notification",type);
      n.innerText = message;
      document.getElementById("notification-area").appendChild(n);
      setTimeout(()=>{
        var notifications = document.getElementById("notification-area").getElementsByClassName("notification");
        for(let i=0;i<notifications.length;i++){
          if(notifications[i].getAttribute("id") == id){
            notifications[i].remove();
            break;
          }
        }
      },5000);
    })();
  }
  
function notifyCopy(){
    notify("copied", "Successfully copied your delivery to clipboard!");
    accountsElement.select()
    document.execCommand('copy')
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

document.getElementById("download-button").addEventListener("click", function(){
    var text = document.getElementById('accounts').value
    var filename = "accounts.txt";
    
    download(filename, text);
}, false);

const supportButtons = document.querySelectorAll('[data-support-button]')

supportButtons.forEach(button => {
    button.addEventListener('click', () => {
      closeButton(button)
    })
})

function closeButton(button) {
    button.classList.add('active')
}

const openModalButtons = document.querySelectorAll('[data-modal-target]')
const closeModalButtons = document.querySelectorAll('[data-close-button]')
const overlay = document.getElementById('overlay')

openModalButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = document.querySelector(button.dataset.modalTarget)
    openModal(modal)
  })
})

document.getElementById('support-link').addEventListener('click', function() {
  const modal = document.getElementById('modal')
  openModal(modal)
})

overlay.addEventListener('click', () => {
  const modals = document.querySelectorAll('.modal.active')
  modals.forEach(modal => {
    closeModal(modal)
  })
})

closeModalButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = button.closest('.modal')
    closeModal(modal)
  })
})

function openModal(modal) {
  if (modal == null) return
  modal.classList.add('active')
  overlay.classList.add('active')
}

function closeModal(modal) {
  if (modal == null) return
  modal.classList.remove('active')
  overlay.classList.remove('active')
}