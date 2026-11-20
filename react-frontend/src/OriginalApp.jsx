
import './App.css';

import Card from './components/ui/Card';
import Form from './components/ui/Form';
import Counter from './components/ui/Counter';

const users = [
  'Leanne Graham',
  'Ervin Howell',
  'Clementine Bauch',
  'Patricia Lebsack',
  'Chelsey Dietrich',
  'Mrs. Dennis Schulist',
  'Kurtis Weissnat',
  'Nicholas Runolfsdottir V',
  'Glenna Reichert',
  'Clementina DuBuque'
];

function App() {
  return (
    <>
      <h1>Hello React!</h1>

      <Card name="Jicel" description="This is me" />
      <Card name="Mikayla" description="Not me" />

      <Counter />
      <Form />

      <ul>
        {users.map((user, index) => (
          <li key={index}>{user}</li>
        ))}
      </ul>
    </>
  );
}

export default App;
