
import { useState } from 'react';

function Form() {
  const [name, setName] = useState('');
  const [submittedName, setSubmittedName] = useState('');

  function handleSubmit(event) {
    event.preventDefault();

    if (name.trim() === '') {
      return;
    }

    setSubmittedName(name.trim());
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Input your name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <button type="submit">Submit</button>
      </form>

      {submittedName && (
        <p>Hello, {submittedName}!</p>
      )}
    </div>
  );
}

export default Form;
