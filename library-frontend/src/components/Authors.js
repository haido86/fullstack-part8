import { gql, useMutation, useQuery } from '@apollo/client';
import { useState } from 'react';
import Select from 'react-select';

export const ALL_AUTHORS = gql`
  query {
    allAuthors {
      name
      born
      bookCount
      id
    }
  }
`;

const EDIT_BORN = gql`
  mutation editBorn($name: String!, $setBornTo: Int!) {
    editAuthor(name: $name, setBornTo: $setBornTo) {
      name
      born
    }
  }
`;

const Authors = (props) => {
  const [name, setName] = useState('');
  const [born, setBorn] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const result = useQuery(ALL_AUTHORS);
  const [changeBorn] = useMutation(EDIT_BORN, {
    refetchQueries: [{ query: ALL_AUTHORS }],
  });

  console.log('result', result);
  if (!props.show) {
    return null;
  }
  if (result.loading) {
    return <div>loading...</div>;
  }

  const authors = result.data.allAuthors;
  console.log('authors', authors);

  const submit = async (event) => {
    event.preventDefault();
    changeBorn({ variables: { name, setBornTo: +born } });
    setName('');
    setBorn('');
  };

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>set birthyear</h2>
      <form onSubmit={submit}>
        <Select
          defaultValue={selectedOption}
          onChange={setSelectedOption}
          options={authors.map((author) => ({
            value: author.name,
            label: author.name,
          }))}
        />

        <div>
          born{' '}
          <input
            value={born}
            onChange={({ target }) => setBorn(target.value)}
          />
        </div>
        <button type="submit">change birthyear</button>
      </form>
    </div>
  );
};

export default Authors;
