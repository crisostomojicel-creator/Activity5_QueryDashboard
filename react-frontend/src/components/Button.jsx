function Button() {
function handleClick() {
    alert('Hello! You clicked the button.');
}

return (
    <div>
    <button onClick={handleClick}>Click Me</button>
    </div>
);
}

export default Button;
