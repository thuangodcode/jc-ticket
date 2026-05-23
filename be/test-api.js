const axios = require('axios');

console.log('Sending request to forgot-password...');
axios.post('https://jc-ticket.onrender.com/api/auth/forgot-password', {
  email: '120304thuan@gmail.com'
}, { timeout: 15000 })
.then(res => {
  console.log('SUCCESS:', res.status, res.data);
})
.catch(err => {
  if (err.response) {
    console.log('API ERROR:', err.response.status, err.response.data);
  } else {
    console.log('NETWORK/TIMEOUT ERROR:', err.message);
  }
});
