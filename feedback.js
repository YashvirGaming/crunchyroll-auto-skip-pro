function showMessage(text) {
  const msg = document.createElement("div");
  msg.textContent = text;

  Object.assign(msg.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "10px 15px",
    background: "black",
    color: "white",
    zIndex: 9999,
    borderRadius: "8px",
    fontSize: "14px"
  });

  document.body.appendChild(msg);

  setTimeout(() => {
    msg.remove();
  }, 1500);
}

window.__cr_feedback = { showMessage };
