class PusherController < ApplicationController
  skip_before_filter :verify_authenticity_token, :only => [:auth]

  def auth
    response = Pusher[params[:channel_name]].authenticate(params[:socket_id])
    render :json => response
  end

end