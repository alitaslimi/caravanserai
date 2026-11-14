(function () {
  var KEY = 'caravanserai-progress-v1';

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || { completed: {}, quizzes: {} };
    } catch (err) {
      return { completed: {}, quizzes: {} };
    }
  }

  function write(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function setLesson(id, complete) {
    var state = read();
    if (complete) state.completed[id] = new Date().toISOString();
    else delete state.completed[id];
    write(state);
  }

  window.BookProgress = {
    isComplete: function (id) {
      return !!read().completed[id];
    },
    toggleComplete: function (id) {
      setLesson(id, !this.isComplete(id));
    },
    saveQuiz: function (id, answers) {
      var state = read();
      state.quizzes[id] = answers;
      write(state);
    },
    getQuiz: function (id) {
      return read().quizzes[id] || {};
    }
  };
})();
