/**
 * This file provided by Facebook is for non-commercial testing and evaluation purposes only.
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var m = mori;

var styles = {
  selected: {
    backgroundColor: "green",
    fontSize: 30
  },
  notselected: {
    backgroundColor: "white",
    fontSize: 12
  },
  beginning: {

  },
  end: {

  },
  step: {

  },
  step_back: {

  }
};

var createNode = function(config) {
  return(
    <Node config={config}/>
  );
};

var getStyle = function(config) {
  return m.get(config, "evaluated") ? styles.selected : styles.notselected;
};

var infixNode = function(config) {
  var style = getStyle(config);
  return (
    <span style={style} title={m.get(config, "value", "NOT EVALUATED YET")}>
      {createNode(m.getIn(config, ["children", 0]))}
      <span>{m.get(config, "prependSource", "")}</span>
      <span>{m.get(config, "textSource", "")}</span>
      <span>{m.get(config, "appendSource", "")}</span>
      {createNode(m.getIn(config, ["children", 1]))}
    </span>
  );
};

var prefixNode = function(config) {
  var style = getStyle(config);
  return (
    <span style={style} title={m.get(config, "value", "NOT EVALUATED YET")}>
      <span>{m.get(config, "prependSource", "")}</span>
      <span>{m.get(config, "textSource", "")}</span>
      <span>{m.get(config, "prependArgs", "")}</span>
      {m.intoArray(m.map(createNode, m.get(config, "children")))}
      <span>{m.get(config, "appendArgs", "")}</span>
      <span>{m.get(config, "appendSource", "")}</span>
    </span>
  );
};

var Node = React.createClass({
  render: function() {
    if (m.get(this.props.config, "infix")) {
      return infixNode(this.props.config)
    } else {
      return prefixNode(this.props.config)
    }
  }
});

var App = React.createClass({
  getInitialState: function() {
    return {
      loaded: false,
      snapshots: m.toClj([]),
      config: null,
      currentIndex: -1
    };
  },
  render: function() {
    if (this.state.loaded) {
      return (
        <div>
          <Node config={this.state.config}/>
          <div>
            <button style={styles.beginning} onClick={this.goToBeginning}>Beginning</button>
            <button style={styles.step_back} onClick={this.stepBack}>Step Back</button>
            <button style={styles.step} onClick={this.step}>Step</button>
            <button style={styles.end} onClick={this.goToEnd}>End</button>
          </div>
        </div>
      );
    } else {
      return <div>Loading...</div>;
    }
  },
  componentDidMount: function() {
    var initialSnapshot = m.toClj({
      evaluated: false,
      evalPath: [],
      infix: false,
      textSource: "sum",
      children: [
        {
          evaluated: false,
          evalPath: [0],
          textSource: "one",
          appendSource: ","
        },
        {
          evaluated: false,
          evalPath: [1],
          textSource: "two",
          prependSource: " "
        }
      ],
      prependArgs: "(",
      appendArgs: ")"
    });

    var events = m.toClj([
      {
        path: [0],
        value: "one"
      },
      {
        path: [1],
        value: "two"
      },
      {
        path: [],
        value: "three"
      }
    ]);

    this.setState({
      config: initialSnapshot,
      snapshots: this.getAllSnapshots(initialSnapshot, events),
      loaded: true,
      currentIndex: 0
    });
  },
  updateEvalState: function(index) {
    this.setState({
      currentIndex: index,
      config: m.nth(this.state.snapshots, index)
    });
  },
  getAllSnapshots: function(initialSnapshot, events) {
    return m.reduce(this.getSnapshot, m.vector(initialSnapshot), events);
  },
  getSnapshot: function(snapshots, event) {
    var updateDictionary = {
      value: m.get(event, "value"),
      evaluated: true
    };
    var evalPath = m.get(event, "path");
    var lastSnapshot = m.last(snapshots);

    return m.conj(snapshots, this.updateConfig(lastSnapshot, evalPath, updateDictionary));
  },
  updateConfig: function(lastSnapshot, evalPath, value) {
    var childrenList = m.repeat(m.count(evalPath), "children");
    var interleavedEvalPath = m.interleave(childrenList, evalPath);
    var newConfigAtPath = m.getIn(lastSnapshot, interleavedEvalPath);
    for (var key in value) {
      newConfigAtPath = m.assoc(newConfigAtPath, key, value[key])
    }
    var updatedConfig;
    if (m.isEmpty(interleavedEvalPath)) {
      updatedConfig = m.conj(lastSnapshot, interleavedEvalPath, newConfigAtPath)
    } else {
      updatedConfig = m.assocIn(lastSnapshot, interleavedEvalPath, newConfigAtPath)
    }

    return updatedConfig;
  },
  goToBeginning: function() {
    this.updateEvalState(0);
  },
  stepBack: function() {
    var currentIndex = this.state.currentIndex;
    var newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
    this.updateEvalState(newIndex);
  },
  step: function() {
    var currentIndex = this.state.currentIndex;
    var maxIndex = m.count(this.state.snapshots) - 1;
    var newIndex = currentIndex < maxIndex ? currentIndex + 1 : maxIndex;
    this.updateEvalState(newIndex);
  },
  goToEnd: function() {
    this.updateEvalState(m.count(this.state.snapshots) - 1);
  }
});

React.render(
  <App/>,
  document.getElementById('content')
);