export default (amount) => {
  let result = '';
  if (amount < 0) result +='-';
  const absamount = Math.abs(amount);
  const cents = absamount % 100;
  const dollars = Math.floor(absamount/100);
  result = dollars.toS
}