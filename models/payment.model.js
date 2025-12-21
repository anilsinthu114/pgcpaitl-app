exports.insertFromForm = async (conn, payment) => {
    const [res] = await conn.query(`
      INSERT INTO application_payments
      (utr, amount, status, created_at)
      VALUES (?, ?, 'verified', NOW())
    `, [
      payment.utr,
      payment.amount
    ]);
  
    return { id: res.insertId };
  };
  