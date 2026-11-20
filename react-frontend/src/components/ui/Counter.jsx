
import { useEffect, useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Click Me
      </button>

      <button>
        Count: {count}
      </button>
    </div>
  );
}

export default Counter;
