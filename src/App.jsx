const login = async () => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
  });

  console.log("LOGIN RESPONSE:", { data, error });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Check your email 📩");
};