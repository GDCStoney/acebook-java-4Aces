'use strict'

const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');

const follow = require('./follow');

const root = '/api';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {posts: [], attributes: [], pageSize: 2, links: {}};
        this.onDelete = this.onDelete.bind(this);
        this.onNavigate = this.onNavigate.bind(this);
        this.updatePageSize = this.updatePageSize.bind(this);
    }

    loadFromServer(pageSize) {
        follow(client, root, [
            {rel: 'posts', params: {size: pageSize}}
        ]).then(postCollection => {
            return client({
                method: 'GET',
                path: postCollection.entity._links.profile.href,
                headers: {'Accept': 'application/schema+json'}
            }).then(schema => {
                this.schema = schema.entity;
                return postCollection;
            });
        }).then(postCollection => {
            this.setState({
                posts: postCollection.entity._embedded.posts,
                attributes: Object.keys(this.schema.properties),
                pageSize: pageSize,
                links: postCollection.entity._links
            });
        });
    }

    componentDidMount() {
        this.loadFromServer(this.state.pageSize);
    }

    onDelete(post) {
        client({method: 'DELETE', path: post._links.self.href}).then(response => {
            this.loadFromServer(this.state.pageSize);
        });
    }

    onNavigate(navUri) {
        client({mehtod: 'GET', path: navUri}).then(postCollection => {
            this.setState({
                posts: postCollection.entity._embedded.posts,
                attributes: this.state.attributes,
                pageSize: this.state.pageSize,
                links: postCollection.entity._links
            });
        });
    }

    updatePageSize(pageSize) {
        if(pageSize !== this.state.pageSize) {
            this.loadFromServer(pageSize);
        }
    }

    render() {
        return (
            <div>
                <PostList posts={this.state.posts}
                    links={this.state.links}
                    pageSize={this.state.pageSize}
                    onDelete={this.onDelete}
                    onNavigate={this.onNavigate}
                    updatePageSize={this.updatePageSize}
                />
            </div>
        )
    }
}

class PostList extends React.Component {
    constructor(props) {
        super(props);
        this.handleInput = this.handleInput.bind(this);
        this.handleNavFirst = this.handleNavFirst.bind(this);
        this.handleNavPrev = this.handleNavPrev.bind(this);
        this.handleNavNext = this.handleNavNext.bind(this);
        this.handleNavLast = this.handleNavLast.bind(this);
    }

    handleInput(e) {
        e.preventDefault();

        const pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;
        if (/^[0-9]+$/.test(pageSize)) {
            this.props.updatePageSize(pageSize);
        } else {
            ReactDOM.findDOMNode(this.refs.pageSize).value =
                pageSize.substring(0, pageSize.length - 1);
        }
    }

    handleNavFirst(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.first.href);
    }

    handleNavPrev(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.prev.href);
    }

    handleNavNext(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.next.href);
    }

    handleNavLast(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.last.href);
    }

    render() {
        const posts = this.props.posts.map(post =>
            <Post key={post._links.self.href} post={post} onDelete={this.props.onDelete}/>
        );

        const navLinks = [];
        if ("first" in this.props.links) {
            navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
        }

        if ("prev" in this.props.links) {
            navLinks.push(<button key="prev" onClick={this.handleNavPrev}>$lt;</button>);
        }

        if ("next" in this.props.links) {
            navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
        }

        if ("last" in this.props.links) {
            navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
        }

        return (
            <div>
                <input ref="pageSize" defaultValue={this.props.pageSize} onInput={this.handleInput}/>
                <table>
                    <tbody>
                        <tr>
                            <th>content</th>
                            <th></th>
                        </tr>
                        {posts}
                    </tbody>
                </table>
                <div>
                    {navLinks}
                </div>
            </div>
        )
    }
}

class Post extends React.Component {
    constructor(props) {
        super(props);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleDelete() {
        this.props.onDelete(this.props.post);
    }

    render() {
        return (
            <tr>
                <td>{this.props.post.content}</td>
                <td>
                    <button onClick={this.handleDelete}>Del</button>
                </td>
            </tr>
        )
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('react')
)
