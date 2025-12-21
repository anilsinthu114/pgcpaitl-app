// exports.createDraft = async (conn, data) => {
//     const [res] = await conn.query(
//       "INSERT INTO applications (...) VALUES (...)"
//     );
  
//     return {
//       id: res.insertId,
//       prettyId: `PGCPAITL-2025-${String(res.insertId).padStart(6, "0")}`
//     };
//   };
  

exports.insert = async (conn, data, paymentId) => {
    const [res] = await conn.query(`
      INSERT INTO applications
      (fullName, email, mobile, payment_id, status, submitted_at)
      VALUES (?, ?, ?, ?, 'submitted', NOW())
    `, [
      data.fullName,
      data.email,
      data.mobile,
      paymentId
    ]);
  
    return {
      id: res.insertId,
      prettyId: `PGCPAITL-2025-${String(res.insertId).padStart(6, "0")}`,
      email: data.email,
      fullName: data.fullName
    };
  };
  