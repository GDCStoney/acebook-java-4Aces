'use strict'

const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');
const when = require('when');

const follow = require('./follow');

const root = '/api';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {posts: [], attributes: [], pageSize: 2, links: {}};
        this.onDelete = this.onDelete.bind(this);
        this.onNavigate = this.onNavigate.bind(this);
        this.updatePageSize = this.updatePageSize.bind(this);
        this.onCreate = this.onCreate.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
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
                this.links = postCollection.entity._links;
                return postCollection;
            });
        }).then(postCollection => {
            return postCollection.entity._embedded.posts.map(post =>
                client({
                    method: 'GET',
                    path: post._links.self.href
                })
            );
        }).then(postPromises => {
            return when.all(postPromises);
        }).then(posts => {
            this.setState({
                posts: posts,
                attributes: Object.keys(this.schema.properties),
                pageSize: pageSize,
                links: this.links
            });
        });
    }

    onDelete(post) {
        client({
            method: 'DELETE',
            path: post.entity._links.self.href
        }).then(response => {
            this.loadFromServer(this.state.pageSize);
        });
    }

    onNavigate(navUri) {
        client({
            method: 'GET',
            path: navUri
        }).then(postCollection => {
            this.links = postCollection.entity._links;

            return postCollection.entity._embedded.posts.map(post =>
                client({
                    method: 'GET',
                    path: post._links.self.href
                })
            );
        }).then(postPromises => {
            return when.all(postPromises);
        }).then(posts => {
            this.setState({
                posts: posts,
                attributes: Object.keys(this.schema.properties),
                pageSize: this.state.pageSize,
                links: this.links
            });
        });
    }

    updatePageSize(pageSize) {
        if(pageSize !== this.state.pageSize) {
            this.loadFromServer(pageSize);
        }
    }

    onCreate(newPost) {
        const self = this;

        follow(client, root, ['posts']).then(response => {
            return client({
                method: 'POST',
                path: response.entity._links.self.href,
                entity: newPost,
                headers: {'Content-Type': 'application/json'}
            });
        }).then(response => {
            return follow(client, root, [
                {rel: 'posts', params: {'size': self.state.pageSize}}
            ]);
        }).then(response => {
            if (typeof response.entity._links.last !== "undefined") {
                this.onNavigate(response.entity._links.last.href);
            } else {
                this.onNavigate(response.entity._links.self.href);
            }
        });
    }

    onUpdate(post, updatedPost) {
        client({
            method: 'PUT',
            path: post.entity._links.self.href,
            entity: updatedPost,
            headers: {
                'Content-Type': 'application/json',
                'If-Match': post.headers.Etag
            }
        }).then(response => {
            this.loadFromServer(this.state.pageSize);
        }, response => {
            if (response.status.code === 412) {
                alert('DENIED: Unable to update ' +
                    post.entity._links.self.href + '. Your copy is stale.');
            }
        });
    }

    componentDidMount() {
        this.loadFromServer(this.state.pageSize);
    }

   render() {
        return (
            <div>
                <div>
                    <form action="/logout" method="get">
                        <input type="submit" value="Logout"/>
                    </form>
                </div>
                <div>
                    <PostList posts={this.state.posts}
                        links={this.state.links}
                        attributes={this.state.attributes}
                        pageSize={this.state.pageSize}
                        onDelete={this.onDelete}
                        onNavigate={this.onNavigate}
                        updatePageSize={this.updatePageSize}
                        onUpdate={this.onUpdate}
                    />
                    <div>
                        <CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
                    </div>
                </div>
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
            this.props.updatePageSize(parseInt(pageSize));
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
            <Post key={post.entity._links.self.href}
                post={post}
                attributes={this.props.attributes}
                onDelete={this.props.onDelete}
                onUpdate={this.props.onUpdate}/>
        );

        const navLinks = [];
        if ("first" in this.props.links) {
            navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
        }

        if ("prev" in this.props.links) {
            navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
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
                <td>{this.props.post.entity.content}</td>
                <td>
                    <UpdateDialog post={this.props.post}
                        attributes={this.props.attributes}
                        onUpdate={this.props.onUpdate}/>
                </td>
                <td>
                    <button onClick={this.handleDelete}>Del</button>
                </td>
            </tr>
        )
    }
}

class CreateDialog extends React.Component {
    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();
        const newPost = {};
        this.props.attributes.forEach(attribute => {
            newPost[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        this.props.onCreate(newPost);

        this.props.attributes.forEach(attribute => {
            ReactDOM.findDOMNode(this.refs[attribute]).value = '';
        });

        window.location = "#";
    }

    render() {
        const inputs = this.props.attributes.map(attribute =>
            <p key={attribute}>
                <input type="text" placeholder={attribute} ref={attribute} className="field"/>
            </p>
        );

        return (
            <div>
                <div className="center">
                    <a href="#createPost">Create</a>
                </div>
                <div id="createPost" className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>
                        <h2>Create new post</h2>
                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit}>Create</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}

class UpdateDialog extends React.Component {
    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();

        const updatedPost = {};

        this.props.attributes.forEach(attribute => {
            updatedPost[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        this.props.onUpdate(this.props.post, updatedPost);
        window.location="#";
    }

    render() {
        const inputs = this.props.attributes.map(attribute =>
            <p key={this.props.post.entity[attribute]}>
                <input type="text" placeholder={attribute}
                    defaultValue={this.props.post.entity[attribute]}
                    ref={attribute} className="field"/>
            </p>
        );

        const dialogId = "updatePost-" + this.props.post.entity._links.self.href;

        return (
            <div key={this.props.post.entity._links.self.href}>
                <a href={"#" + dialogId}>Update</a>
                <div id={dialogId} className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>
                        <h2>Update a Post</h2>
                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit}>Update</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('react')
)
