import React, { Component } from 'react';
import 'normalize.css';
import 'github-markdown-css';
import axios from 'axios';
import cx from 'classnames';
import marked from 'marked';
import './App.scss';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      notebooks: [],
      currentBookIndex: 0,
      notes: [],
      currentNote: null
    };
  }

  // 使用classnames 优化className
  // 格式化note.body(省略号),datetime(通过new Date('')、刚刚、前天、昨天、2月13日 23:23).

  componentDidMount() {
    axios.get('http://localhost:3100/notebooks').then(res => {
      this.setState({ notebooks: res.data });
      const currentBook = res.data[this.state.currentBookIndex];
      this.loadNotes(currentBook.id);
    });
  }

  render() {
    const notebooks = this.state.notebooks;
    const currentNote = this.state.currentNote;
    return (
      <div className="app">
        <div className="sidebar">
          <div className="header">
            <button className="button adder" onClick={() => this.handleAddNote()}>
              <i className="iconfont icon-add"></i>
              新建笔记
            </button>
          </div>
          <div className="body">
            <div className="notebooks">
              <div className="header has-icon">
                <i className="iconfont icon-books"></i>
                笔记本
              </div>
              <div className="body">
                <ul className="notebooks-list">
                  {
                    notebooks.map((notebook, index) => (
                      <li key={notebook.id} 
                        className={this.handleActiveClassName('currentBookIndex', ['notebook-item'], index)}
                        onClick={() => this.handleSelectBook(index)}>
                        <div className="title has-icon">
                          <i className="iconfont icon-book"></i>
                          {notebook.name}
                        </div>
                        <button className="button trash"><i className="iconfont icon-trash"></i></button>
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="notes-panel">
          <div className="header">读书笔记</div>
          <div className="body">
            <ul className="notes-list">
            {
              this.state.notes.map((note, index) => (
                <li key={note.id}>
                  <div className={cx('note-brief', { active: currentNote && currentNote.id === note.id })}>
                    <div className="box" onClick={() => this.handleEditNote(note.id)}>
                      <div className="header">{note.title}</div>
                      <div className="body">
                        {note.body}
                      </div>
                    </div>
                    <div className="footer">
                      <div className="datetime">{note.datetime}</div>
                      <button className="trash button" onClick={() => this.handleDeleteNote(note.id)}>
                        <i className="iconfont icon-trash"></i>
                      </button>
                    </div>
                  </div>
                </li>
              ))
            }
            </ul>
          </div>
        </div>
        { currentNote ?
          <div className="note-panel">
            <div className="header">
              <div className="category has-icon">
                <i className="iconfont icon-notebook"></i>
                读书笔记
              </div>
              <div className="title">
                <input name="title" type="text" value={currentNote.title} onChange={e => this.handleFieldChange(e)}/>
              </div>
            </div>
            <div className="body">
              <div className="editor">
                <textarea name="body" 
                  value={currentNote.body} 
                  onChange={e => this.handleFieldChange(e)}
                  onKeyDown={e => this.handlePressTab(e)}
                ></textarea>
              </div>
              <div className="preview markdown-body">
                <div dangerouslySetInnerHTML={{ __html: marked(currentNote.body) }}></div>
              </div>
            </div>
          </div> : null
        }
      </div>
    );
  }

  handleActiveClassName(feildName, defaultClasses, index) {
    return cx(...defaultClasses, { active: this.state[feildName] === index });
  }

  handleSelectBook(index) {
    this.setState({ currentBookIndex: index });
    const book = this.state.notebooks[index];
    this.loadNotes(book.id);
  }

  loadNotes(bookId) {
    axios.get(`http://localhost:3100/notes?bookId=${bookId}`).then(res => {
      console.log(res.data);
      this.setState({ notes: res.data });
    });
  }

  handleAddNote() {
    const note = {
      title: '新建笔记',
      body: '',
      datetime: new Date().toISOString(),
      bookId: this.state.notebooks[this.state.currentBookIndex].id
    };
    axios.post(`http://localhost:3100/notes${note}`).then(res => {
      this.reloadNotes();
    });
  }

  reloadNotes() {
    const bookId = this.state.notebooks[this.state.currentBookIndex].id;
    this.loadNotes(bookId);
  }

  handleDeleteNote(noteId) {
    axios.delete(`http://localhost:3100/notes/${noteId}`).then(res => {
      this.reloadNotes();
    });
  }

  handleEditNote(noteId) {
    axios.get(`http://localhost:3100/notes/${noteId}`).then(res => {
      this.setState({ currentNote: res.data });
    });
  }

  handleFieldChange(e) {
    const note = {
      ...this.state.currentNote,
      [e.target.name]: e.target.value
    };

    this.setState({
      currentNote: note
    });
    
    axios.put(`http://localhost:3100/notes/${this.state.currentNote.id}`, note);

    const notes = [...this.state.notes];
    const index = notes.findIndex(o => o.id === this.state.currentNote.id);
    if (index !== -1) {
      notes[index] = note;
      this.setState({ notes: notes });
    }
  }

  handlePressTab(e) {
    if ( e.keyCode === 9 ) {

      // Set up some variables. We need to know the current position of the cursor or selection.
      var selectionStartPos = e.target.selectionStart;
      var selectionEndPos   = e.target.selectionEnd;
      var oldContent        = e.target.value;

      // Set the new content.
      e.target.value = oldContent.substring( 0, selectionStartPos ) + "\t" + oldContent.substring( selectionEndPos );

      // Set the new cursor position (current position + 1 to account for the new tab character).
      e.target.selectionStart = e.target.selectionEnd = selectionStartPos + 1;

      // Prevent the default action (tabbing to the next field or control).
      e.preventDefault();
      
      this.handleFieldChange(e);
    }
  }
}

export default App;
