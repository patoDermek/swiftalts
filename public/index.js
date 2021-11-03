const openModalButtons = document.querySelectorAll('[data-modal-target]')
const closeModalButtons = document.querySelectorAll('[data-close-button]')
const overlay = document.getElementById('modal-overlay')

openModalButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = document.querySelector(button.dataset.modalTarget)
    const shopItem = button.parentElement.parentElement.parentElement
    const textFile = shopItem.getElementsByClassName('account-card-text-file')[0].innerHTML
    const minAccounts = shopItem.getElementsByClassName('account-card-modal-min-accounts')[0].innerText
    const accountName = shopItem.getElementsByClassName('card-name')[0].innerText
    fetch(textFile)
    .then((Response) => {
      return Response.text()
    })
    .then((data) => {
      let nLines = 0;
      for( let i = 0, n = data.length;  i < n;  ++i ) {
        if( data[i] === '\n' ) {
            ++nLines;
        }
      }

      if (nLines >= minAccounts) {
        openModal(modal)
        let shopItem = button.parentElement.parentElement.parentElement
        let accountName = shopItem.getElementsByClassName('card-name')[0].innerText
        let accountPrice = shopItem.getElementsByClassName('card-price')[0].innerText
        let modalDescription = shopItem.getElementsByClassName('account-card-modal-description')[0].innerText
        let modalMinAccounts = shopItem.getElementsByClassName('account-card-modal-min-accounts')[0].innerText
        let modalMinPrice = shopItem.getElementsByClassName('account-card-modal-min-price')[0].innerText
        let stripeAccountImage = shopItem.getElementsByClassName('account-card-stripe-image')[0].innerText
        let textFile = shopItem.getElementsByClassName('account-card-text-file')[0].innerText
        addItemsToModal(accountName, accountPrice, modalDescription, modalMinAccounts, modalMinPrice, stripeAccountImage, textFile, nLines)
      } else if (nLines < minAccounts) {
        let n = document.createElement("div");
        let id = Math.random().toString(36).substr(2,10);
        n.setAttribute("id",id);
        n.classList.add("notification","error");
        n.innerText = `Sorry, we do not have enough ${accountName} in stock.`;
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
      }
    })
    .catch((error) => {
      console.error(error);
    })
  })
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

document.getElementById('notification-area').addEventListener('click', function() {
  const modals = document.querySelectorAll('.modal.active')
  modals.forEach(modal => {
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

function addItemsToModal(accountName, accountPrice, modalDescription, modalMinAccounts, modalMinPrice, stripeAccountImage, textFile, nLines) {
  let modal = document.getElementsByClassName('modal')[0]
  let titleElement = modal.getElementsByClassName('modal-title')[0]
  let priceElement = modal.getElementsByClassName('modal-info-price')[0]
  let descriptionElement = modal.getElementsByClassName('modal-description')[0]
  let emailElement = modal.getElementsByClassName('email-input')[0]
  let quantityLabelDescription = modal.getElementsByClassName('quantity-label-description')[0]
  let minAccountsElement = modal.getElementsByClassName('accountsNumber')[0]
  let minPriceElement = modal.getElementsByClassName('modal-price')[0]
  let stripeAccountImageElement = modal.getElementsByClassName('modal-account-card-stripe-image')[0]
  let modalIdElement = modal.getElementsByClassName('modal-account-card-id')[0]
  let modalStockElement = modal.getElementsByClassName('modal-info-stock')[0]
  let modalContent = document.getElementsByClassName('modal-content')[0]
  let small = modalContent.querySelector('small')
  titleElement.innerText = ''
  priceElement.innerText = ''
  descriptionElement.innerText = ''
  emailElement.value = ''
  quantityLabelDescription.innerText = ''
  minAccountsElement.value = ''
  minAccountsElement.removeAttribute('min')
  minPriceElement.innerText = ''
  stripeAccountImageElement.innerText = ''
  modalIdElement.innerText = ''
  modalStockElement.innerText = ''
  modalContent.className = 'modal-content'
  small.innerText = ''
  titleElement.append(accountName)
  priceElement.append(accountPrice)
  descriptionElement.append(modalDescription)
  quantityLabelDescription.append('Minimum Accounts: ' + modalMinAccounts)
  minAccountsElement.value = modalMinAccounts
  minAccountsElement.setAttribute('min', modalMinAccounts)
  minPriceElement.append(modalMinPrice)
  stripeAccountImageElement.append(stripeAccountImage)
  modalIdElement.append(textFile)
  modalStockElement.append(nLines + 1)
}

let decButtons = document.getElementsByClassName('decButton')[0]
let incButtons = document.getElementsByClassName('incButton')[0]
let accountsNumbers = document.getElementsByClassName('accountsNumber')[0]

decButtons.addEventListener('click', decButtonsFunction)
incButtons.addEventListener('click', incButtonsFunction)
accountsNumbers.addEventListener('change', setMinValue)

function setMinValue() {
  let min = accountsNumbers.getAttribute('min')

  if (accountsNumbers.value <= min) {
    accountsNumbers.value = min
    updateAccountTotal()
  } else {
    updateAccountTotal()
  }
}

function decButtonsFunction() {
  let min = accountsNumbers.getAttribute('min')

  if (accountsNumbers.value <= min) {
    accountsNumbers.value = min
  } else {
    accountsNumbers.value = parseInt(accountsNumbers.value) - 1
  }
  updateAccountTotal()
}

function incButtonsFunction() {
  accountsNumbers.value = parseInt(accountsNumbers.value) + 1
  updateAccountTotal()
}

function updateAccountTotal() {
  let modalItemContainer = document.getElementsByClassName('modal')[0]
  let modalContents = modalItemContainer.getElementsByClassName('modal-content')
  let total = 0
  for (let i = 0; i < modalContents.length; i++) {
    let modalContent = modalContents[i]
    let priceElement = modalContent.getElementsByClassName('modal-info-price')[0]
    let quantityElement = modalContent.getElementsByClassName('accountsNumber')[0]
    let price = parseFloat(priceElement.innerText.replace('$', ''))
    let quantity = quantityElement.value
    quantityElement.setAttribute('value', quantity)
    total = total + (price * quantity)
  }

  total = Math.round(total * 100) / 100
  document.getElementsByClassName('modal-price')[0].innerText = total
}

let continueButton = document.getElementById('buttonContinue')

continueButton.addEventListener('click', (e) => {
  e.preventDefault()
  checkInputs()
})

function checkInputs() {
  let email = document.getElementById('email-input')
  let emailValue = email.value.trim()
  let textFile = document.getElementById('modal-account-card-id').innerText
  let quantity = document.getElementById('accountsNumber').value

  fetch(textFile)
  .then((Response) => {
      return Response.text()
  })
  .then((data) => {
      let nLines = 0;
      for( let i = 0, n = data.length;  i < n;  ++i ) {
          if( data[i] === '\n' ) {
              ++nLines;
          }
      }

      if (emailValue === '') {
        setErrorFor(email, 'Email cannot be blank')
      } else if (!isEmail(emailValue)) {
        setErrorFor(email, 'Email is not valid')
      } else if (quantity > (nLines + 1)) {
        let n = document.createElement("div");
        let id = Math.random().toString(36).substr(2,10);
        n.setAttribute("id",id);
        n.classList.add("notification","error");
        n.innerText = `The quantity that you have entered is too high. The max is ${nLines + 1}`;
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
      } else {
        stripeCheckout()
      }
  })
  .catch((error) => {
      console.error(error);
  })
}

function stripeCheckout() {
  let stripe = Stripe('pk_test_51ImcSPAxp76MSr1YWrMzTamO6AEDAQ6dUYsExMzP6c2ho0cY8slyb8Mfc5CWu7ISdBO4OCuv1WmMpg999ANhsBqt00KVyMHb7i')
  let priceElement = document.getElementById('modal-info-price')
  let price = parseFloat(priceElement.innerText.replace('$', '')) * 100
  let emailInput = document.getElementById('email-input').value.trim()
  let quantity = document.getElementById('accountsNumber').value
  let itemName = document.getElementById('modal-title').innerText
  let itemImage = document.getElementsByClassName('modal-account-card-stripe-image')[0].innerText
  let today = new Date();
  let dateTime = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate() + ' '+today.getHours()+':'+today.getMinutes()+':'+today.getSeconds();
  let date = dateTime;
  let textFile = document.getElementsByClassName('modal-account-card-id')[0].innerText
  let stock = document.getElementById('modal-info-stock').innerText

  fetch('/stripe-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price: price,
      quantity: quantity,
      emailInput: emailInput,
      itemName: itemName,
      itemImage: itemImage,
      date: date,
      textFile: textFile,
      stock: stock,
    }),
  })
  .then((Response) => Response.json())
  .then((session) => {
    stripe.redirectToCheckout({ sessionId: session.id })
  })
  .catch((error) => {
    console.error('Error:', error)
  })
}

let email = document.getElementById('email-input')

email.addEventListener('change', removeEmailError)
email.addEventListener('keypress', removeEmailErrorWithKeypress)

function removeEmailError() {
  let modalContent = document.getElementsByClassName('modal-content')[0]
  let small = modalContent.querySelector('small')
  let emailValue = email.value.trim()

  if (modalContent.className === 'modal-content error') {
    if (isEmail(emailValue)) {
      modalContent.className = 'modal-content'
      small.innerText = ''
    } else {
      return
    }
  } else {
    return
  }
}

function removeEmailErrorWithKeypress() {
  let modalContent = document.getElementsByClassName('modal-content')[0]
  let small = modalContent.querySelector('small')
  let emailValue = email.value.trim()

  if (modalContent.className === 'modal-content error') {
    if (isEmail(emailValue)) {
      modalContent.className = 'modal-content'
      small.innerText = ''
    } else {
      return
    }
  } else {
    return
  }
}

function setErrorFor(input, message) {
  let modalContent = input.parentElement
  let small = modalContent.querySelector('small')

  small.innerText = message
  modalContent.className = 'modal-content error'
}

function isEmail(email) {
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
}

const openModal2Link = document.getElementById('support-link')
const closeModalButtons2 = document.querySelectorAll('[data-close-button2]')

openModal2Link.addEventListener('click', function() {
  const modal = document.getElementById('modal2')
  openModal2(modal)
})

overlay.addEventListener('click', () => {
  const modals = document.querySelectorAll('.modal2.active')
  modals.forEach(modal => {
    closeModal2(modal)
  })
})

closeModalButtons2.forEach(button => {
  button.addEventListener('click', () => {
    const modal = button.closest('.modal2')
    closeModal2(modal)
  })
})

function openModal2(modal) {
  if (modal == null) return
  modal.classList.add('active')
  overlay.classList.add('active')
}

function closeModal2(modal) {
  if (modal == null) return
  modal.classList.remove('active')
  overlay.classList.remove('active')
}