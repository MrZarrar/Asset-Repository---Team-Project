const signupForm = document.getElementById('signForm');
const loginForm = document.getElementById('logForm');

if (signupForm) {
  document.body.classList.add('signup-page');
} else if (loginForm) {
  document.body.classList.add('login-page');
}

const firstName_input = document.getElementById('firstname');
const surname_input = document.getElementById('surname');
const email_input = document.getElementById('email');
const password_input = document.getElementById('password');
const confirmPassword_input = document.getElementById('confirmPassword');
const error_message = document.getElementById('error-message')

const form = signupForm || loginForm;

form.addEventListener('submit', (e) => {

  let errors = [];

  if(firstName_input){
    errors = getSignupErrors(firstName_input.value, surname_input.value, email_input.value, password_input.value, confirmPassword_input.value)
  }else{
    errors = getLoginErrors(email_input.value, password_input.value)
  }
  if(errors.length > 0){
    e.preventDefault();
    error_message.innerHTML = errors.join(". ")
  }
})

function isFirstNameValid(username){
  const trimmedUsername = username.trim();

  if (/\d/.test(trimmedUsername)) {
    return false;
  }

  const word = trimmedUsername.split(/\s+/);
  return word.length <= 2;
}

function isSurnameValid(surname){
  const trimmedSurname = surname.trim();

  if (/\d/.test(trimmedSurname)) {
    return false;
  }

  const word = trimmedSurname.split(/\s+/);
  return word.length <= 2;
}

function isValidEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getSignupErrors(username, surname, email, password, confirmPassword){
  let errors = [];

  if(username === '' || username === null){
    errors.push('Please enter a first name');
    firstName_input.classList.add('incorrect');
  }
  if(!isFirstNameValid(username)){
    errors.push('Please enter a valid first name');
    firstName_input.classList.add('incorrect')
  }

  if(surname === '' || surname === null){
    errors.push('Please enter a second name');
    surname_input.classList.add('incorrect');
  }

  if(!isSurnameValid(surname)){
    errors.push('Please enter a valid second name');
    surname_input.classList.add('incorrect');
  }
 
  if(email === '' || email === null || !isValidEmail(email)){
    errors.push('Please enter a valid email address');
    email_input.classList.add('incorrect');
  }
  if(password === '' || password === null || password.length < 8 || password.length > 20 || !containsString(password)){
    errors.push('Please enter a valid password');
    password_input.classList.add('incorrect');
  }
  if(confirmPassword === '' || confirmPassword === null || confirmPassword !== password){
    errors.push('Please enter the same password');
    password_input.classList.add('incorrect');
    confirmPassword_input.classList.add('incorrect');
  }
  return errors;
}

function getLoginErrors(username, password){
  let errors = [];

  if(username === '' || username == null || !isValidEmail(username)){
    errors.push('Please enter a valid email address')
    username_input.classList.add('incorrect')
  }
  if(password === '' || password === null || password.length < 8 || password.length > 20 || !containsString(password)){
    errors.push('Please enter a valid password');
    password_input.classList.add('incorrect');
  }

  return errors;
}

const allInputs = [firstName_input, surname_input, email_input, password_input, confirmPassword_input].filter(input => input != null)

allInputs.forEach(input => {
  input.addEventListener('input', () => {
    if(input.classList.contains('incorrect')){
      input.classList.remove('incorrect')
      error_message.innerText = ''
    }
  })
})