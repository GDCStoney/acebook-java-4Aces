const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');

const follow = require('./follow');

const root = '/api';

import posts from './posts/posts'
import PostsBuilder from './posts/postsBuilder'

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {posts: [], attributes: [], pageSize: 10, links: {}};
    }

    loadFromServer(pageSize) {
        follow(client, root, [
            {rel: 'posts', params: {size: pageSize}}]
        ).then(postCollection => {
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

    render() {
        return (
            <div>
                <CreateDialog />
                <PostsBuilder />
            </div>
        )
    }
}

ReactDOM.render(
	<App />,
	document.getElementById('app')
)

class CreateDialog extends React.Component {
    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();
        const newPost = {};

        //Navigate away from the dialog to hide it
        window.location = "#";
    }

    render() {

    }
}