const login = async () => {
  console.log("LOGIN CLICKED");

  const res = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

  console.log("LOGIN RESPONSE:", res);

  alert(JSON.stringify(res));
};