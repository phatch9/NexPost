# create routes for subpost module here
from flask_login import current_user, login_required
from app.subpost.models import Subpost, SubpostInfo, Subscription
from app.user.models import User
from flask import Blueprint, jsonify, request
from app.models import UserRole
from app import db
from app.auth.auth import auth_role
import re

subposts = Blueprint("subposts", __name__, url_prefix="/api")
subpost_name_regex = re.compile(r"^\w{3,}$")


@subposts.route("/subposts", methods=["GET"])
def get_subposts():
    limit = request.args.get("limit", default=10, type=int)
    offset = request.args.get("offset", default=0, type=int)
    cur_user = current_user.id if current_user.is_authenticated else None
    subscribed_posts = []
    if current_user.is_authenticated:
        subscribed_posts = [
            subscription.subpost.as_dict(cur_user)
            for subscription in Subscription.query.filter_by(user_id=current_user.id).limit(limit).offset(offset).all()
        ]
    all_subposts = [
        subinfo.as_dict()
        for subinfo in SubpostInfo.query.filter(SubpostInfo.members_count.is_not(None))
        .order_by(SubpostInfo.members_count.desc())
        .limit(limit)
        .offset(offset)
        .all()
    ]
    popular_posts = [
        subinfo.as_dict()
        for subinfo in SubpostInfo.query.filter(SubpostInfo.posts_count.is_not(None))
        .order_by(SubpostInfo.posts_count.desc())
        .limit(limit)
        .offset(offset)
        .all()
    ]
    return (
        jsonify(
            {
                "subscribed": subscribed_posts,
                "all": all_subposts,
                "popular": popular_posts,
            }
        ),
        200,
    )


@subposts.route("/subposts/search", methods=["GET"])
def subpost_search():
    post_name = request.args.get("name", default="", type=str)
    post_name = f"%{post_name}%"
    subpost_list = [
        subpost.as_dict() for subpost in SubpostInfo.query.filter(SubpostInfo.name.ilike(post_name)).all()
    ]
    return jsonify(subpost_list), 200


@subposts.route("/subposts/get/all")
def get_all_post():
    subposts = Subpost.query.order_by(Subpost.name).all()
    return jsonify([t.as_dict() for t in subposts]), 200


@subposts.route("/subposts/<post_name>")
def get_post_by_name(post_name):
    post_info = SubpostInfo.query.filter_by(name=f"t/{post_name}").first()
    subpost = Subpost.query.filter_by(name=f"t/{post_name}").first()
    if not post_info and subpost:
        return jsonify({"message": "Post not found"}), 404
    return (
        jsonify(
            {
                "postData": post_info.as_dict()
                | subpost.as_dict(current_user.id if current_user.is_authenticated else None)
            }
        ),
        200,
    )


@subposts.route("subposts/subscription/<tid>", methods=["POST"])
@login_required
def new_subscription(tid):
    Subscription.add(tid, current_user.id)
    return jsonify({"message": "Subscribed"}), 200


@subposts.route("subposts/subscription/<tid>", methods=["DELETE"])
@login_required
def del_subscription(tid):
    subscription = Subscription.query.filter_by(user_id=current_user.id, subpost_id=tid).first()
    if subscription:
        Subscription.query.filter_by(user_id=current_user.id, subpost_id=tid).delete()
        db.session.commit()
    else:
        return jsonify({"message": "Invalid Subscription"}), 400
    return jsonify({"message": "UnSubscribed"}), 200


@subposts.route("/subpost", methods=["POST"])
@login_required
def new_post():
    image = request.files.get("media")
    form_data = request.form.to_dict()
    if not (name := form_data.get("name")) or not post_name_regex.match(name):
        return jsonify({"message": "Post name is required"}), 400
    subpost = Subpost.add(form_data, image, current_user.id)
    if subpost:
        UserRole.add_moderator(current_user.id, subpost.id)
        return jsonify({"message": "Post has been created"}), 200
    return jsonify({"message": "Something went wrong"}), 500


@subposts.route("/subpost/<tid>", methods=["PATCH"])
@login_required
@auth_role(["admin", "mod"])
def update_post(tid):
    subpost = Subpost.query.filter_by(id=tid).first()
    if not subpost:
        return jsonify({"message": "Invalid Post"}), 400
    image = request.files.get("media")
    form_data = request.form.to_dict()
    subpost.patch(form_data, image)
    return (
        jsonify(
            {
                "message": "Post updated",
                "new_data": {"postData": subpost.as_dict(current_user.id if current_user.is_authenticated else None)},
            }
        ),
        200,
    )


@subposts.route("/subpost/mod/<tid>/<username>", methods=["PUT"])
@login_required
@auth_role(["admin", "mod"])
def new_mod(tid, username):
    user = User.query.filter_by(username=username).first()
    if user:
        UserRole.add_moderator(user.id, tid)
        return jsonify({"message": "Moderator added"}), 200
    return jsonify({"message": "Invalid User"}), 400


@subposts.route("/subpost/mod/<tid>/<username>", methods=["DELETE"])
@login_required
@auth_role(["admin", "mod"])
def delete_mod(tid, username):
    user = User.query.filter_by(username=username).first()
    subpost = Subpost.query.filter_by(id=tid).first()
    if user and subpost:
        if subpost.created_by == user.id and not current_user.has_role("admin"):
            return jsonify({"message": "Cannot Remove Post Creator"}), 400
        UserRole.query.filter_by(user_id=user.id, subpost_id=tid).delete()
        db.session.commit()
        return jsonify({"message": "Moderator deleted"}), 200
    return jsonify({"message": "Invalid User"}), 400